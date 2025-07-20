import $ from './library.js';
import { CALCULATOR_ASSETS as ASSETS } from "./constants.js";
import { CAPTIONS } from './languages.js';

const [MODULO, OPERATORS, FUNCTIONS, SEPARATOR, BRACKET_OPEN,BRACKET_CLOSE] = ASSETS.mathOps;
const [ERR_TYPEMISMATCH, ERR_OVERFLOW, ERR_NEGATIVE_ROOT,ERR_DIV_BY_ZERO,ERR_INVALID_EXP,ERR_UNDEFINED] = ASSETS.errors;
const NUM_REGEX = /[^-0-9,e+e-]|-$|\+$/g; // filters all non-numeric inputs, keeps exponent sign 'e'

export default class Calculator {
    #settings = ASSETS.defaultSettings;
    get settings() { return this.#settings; }
    set settings(newSettings) {
        this.#settings = newSettings ? newSettings : ASSETS.defaultSettings;
    }

    #observer;
    #parent;
    get parent() { return this.#parent; }
    set parent(element) {
        if (typeof element == 'string') {
            this.#parent = $(element);
        } else if (element instanceof HTMLElement) {
            this.#parent = element;
        } else {
            this.#parent = null;
        }
    }

    #buddy = null;
    get buddy() { return this.#buddy; }
    set buddy(element) {
        if (typeof element == 'string') {
            const type = $(element).getAttribute('type') || null;
            this.#buddy = (type == 'text' || type == 'number') ? $(element) : null;
        } else if (element instanceof HTMLInputElement) {
            const type = element.getAttribute('type');
            this.#buddy = (type == 'text' || type == 'number') ? element : null;            
        } else {
            this.#buddy = null;
        }

        if (this.#buddy) {
            const calc = $('divCalculatorPod');
            if (calc) calc.remove();
            if (this.#observer) this.#observer.disconnect();
            this.#observer = undefined;
            this.#init();
        }
    }

    #inputDisplay = null;
    get display() { return this.#inputDisplay; }

    #displayWidth;
    get displayWidth() { return this.#displayWidth; }

    #orientation;
    get orientation() { return this.#orientation; }

    memory = 0;
    groupDigits = true;
    decimals = 10;
    error = false;
    operationIsPending = false;
    calcDone = false;
    currentButton;
    buttonStyle = 0;
    DEF_FONTSIZE = ASSETS.defaultSettings.DEF_FONTSIZE;
    appendToParent = false; // if true, calculator is appended, otherwise insert as the first DOM element

    get prevOperand() { return $('divPrevOperand').innerText; }
    set prevOperand(value = '') {
        $('divPrevOperand').innerText = value;
    }

    get currOperand() { return this.display.innerText; }
    set currOperand(value = '0') {
        this.display.innerText = value;
    }

    get memDisplay() { return $('divMemory').innerText; }
    set memDisplay(value) {
        $('divMemory').innerText = value;
    }

    get currValue() {
        return Number(this.currOperand.replace(NUM_REGEX,'').replace(/,/g, '.'));
    }

    get prevValue() {
        return Number(this.prevOperand.replace(NUM_REGEX,'').replace(/,/g, '.'));
    }

    get termIsOpen() {
        return this.currOperand.includes(BRACKET_OPEN);
    }

    get isNumeric() {
        return typeof this.currentButton === 'string' && (!isNaN(this.currentButton) || this.currentButton === 'π');
    }

    get isBracket() {
        return '()'.includes(this.currentButton);
    }

    get lastInput() {
        return this.currOperand.slice(-1);
    }

    constructor(parent = document.body, buddy, autostart = true) {
        this.parent = parent;
        if (buddy !== undefined) {
            this.buddy = buddy;
        } else {
            this.#init();
        }
        if (autostart) this.show();
    }


    #init() {
        this.#renderCalculator();
        this.loadSettings();
        this.#inputDisplay = $('divInput');
        this.#observer = new MutationObserver(() => this.#adjustDisplay());
        this.#observer.observe(this.#inputDisplay, {
            childList: true,
            subtree: false
        });
        this.settings.DEF_FONTSIZE = this.getStyle(this.#inputDisplay, 'font-size').replace(/\D/g,'');
        this.reset();
    }


    #adjustDisplay() {
        let fntSize = this.settings.DEF_FONTSIZE;
        this.display.style.fontSize = `${this.settings.DEF_FONTSIZE}px`;
        while (this.display.clientWidth > this.displayWidth) {
            fntSize--;
            if (fntSize < 16) break;
            this.display.style.fontSize = `${fntSize}px`;
        }
    }


    /**
     * Display methid of the calculator.
     * If a buddy control is assigned, it's value is going to be displayed.
     */
    show() {
        $('divCalculatorPod').removeAttribute('hidden');
        if (this.buddy) {
            this.reset();
            this.currOperand = this.buddy.value ? this.buddy.value : '0';
        }
        this.#displayWidth = this.display.clientWidth;
    }


    /**
     * Hides the calculator and saves all settings.
     */
    hide() {
        $('divCalculatorPod').setAttribute('hidden','');
        this.saveSettings();
    }


    loadSettings(key = 'calculator-settings') {
        this.settings = JSON.parse(localStorage.getItem(key)) || ASSETS.defaultSettings;
        for (const prop in this.settings) {
            this[prop] = this.settings[prop];
        }
        $('inpDecimals').value = this.decimals;
        $('spnDecimals').innerText = this.decimals;
        $('inpGroupDigits').checked = this.groupDigits;
        $('inpButtonStyle').value = this.buttonStyle;
        this.switchButtonStyle(this.buttonStyle);
    }


    saveSettings(key = 'calculator-settings') {
        for (const prop in this.settings) {
            this.settings[prop] = this[prop];
        }
        localStorage.setItem(key, JSON.stringify(this.settings));
    }


    /**
     * Reset the calculator to its initial values.
     * A stored result in memory is being kept.
     */
    reset() {
        this.currOperand = '0';
        this.prevOperand = '';
        this.memDisplay = (this.memory == 0) ? '' : 'M';
        this.currentButton = null;
        this.error = false;
        this.operationIsPending = false;
        this.calcDone = false;
    }


    /**
     * Deletes the last char from the input display.
     * In case last char was a multi-char operator (i.e. "mod") it will delete these chars.
     */
    deleteLastChar() {
        if (this.currOperand.includes('e')) this.reset();
        const len = this.operationIsPending === MODULO ? -5 : -1;
        if (this.currOperand.slice(len) == this.operationIsPending) this.operationIsPending = false;
        this.currOperand = this.currOperand.slice(0, len);
        if (this.currOperand.length == 0) this.currOperand = 0;
    }


    #handleButtonClick(btn) {
        this.currentButton = btn;
        if (btn == 'AC') this.reset();
        if (this.error) return;
        if (btn == '⌫') this.deleteLastChar();
        if (btn == '=' || btn == '↵') {
            this.compute();
            if (btn == '=') return;
            this.buddy.value = this.currValue.toString().replace('.',',');
            // tell the browser we changed the buddy element...
            this.buddy.dispatchEvent(new CustomEvent('buddychanged'));
            this.hide();
            return;
        }
        if (btn.charAt(0) == 'M') this.handleMemoryOperation(btn);

        if (this.isNumeric) {
            if (this.isOperator() || this.calcDone) {
                if (!this.termIsOpen) {
                    this.prevOperand = this.currOperand;
                    this.currOperand = '';
                }
            }
            this.updateDisplay(btn);
        } else if (this.isOperator(btn)) {
            if (this.isOperator()) {
                let len = this.operationIsPending === MODULO ? -5 : -1;
                this.currOperand = this.currOperand.slice(0, len);
            } else if (this.operationIsPending && !this.termIsOpen) {
                this.compute();
            } else if (this.lastInput == BRACKET_OPEN) {
                if (btn !== '-') return;
            }
            if (this.calcDone) this.calcDone = false;
            this.operationIsPending = btn;
            this.updateDisplay(btn);
        } else if (btn == SEPARATOR) {
            let seperatorIsValid = true;
            if (this.termIsOpen) {
                if (this.lastInput == SEPARATOR) return;
                if (this.lastInput == BRACKET_OPEN || this.isOperator()) this.currOperand += '0';
                const expression = this.currOperand + SEPARATOR;
                seperatorIsValid = expression.lastIndexOf(SEPARATOR) > 
                                   this.currOperand.indexOf(BRACKET_OPEN);
            } else if (this.operationIsPending && this.prevOperand == '') {
                this.prevOperand = this.currOperand;
                this.currOperand = '0';
            } else {
                seperatorIsValid = !this.currOperand.includes(SEPARATOR);
            }
            if (seperatorIsValid) this.updateDisplay(btn);
        } else if (this.isBracket) {
            if (btn == BRACKET_OPEN) {
                if (!this.isOperator() || this.termIsOpen) return;
                this.updateDisplay(btn);
            } else {
                if (!this.termIsOpen) return;
                this.currOperand += btn;
                const str = this.currOperand,
                      term = str.substring(str.indexOf(BRACKET_OPEN), str.indexOf(BRACKET_CLOSE) + 1),
                      operand1 = str.substring(0, str.indexOf(BRACKET_OPEN));
                let result = this.evaluate(term);
                if (result instanceof Error) {
                    this.updateDisplay(result);
                    return;
                }
                this.operationIsPending = operand1.replace(/[0-9]/g, '').replace(',','');
                this.prevOperand = operand1;
                this.currOperand = this.format$(result);
            }
        } else if (FUNCTIONS.includes(btn)) {
            this.updateDisplay(this.executeFunction(btn));
        }
    }


    updateDisplay(expression) {
        if (expression === undefined) return;
        if (expression instanceof Error) {
            this.prevOperand = 'Error';
            this.currOperand = expression.message;
            this.error = true;
            return;
        }
        if (expression == 'π') {
            this.currOperand = this.format$(this.round(Math.PI));
        } else if (this.currOperand == '0' && this.isNumeric || this.calcDone) {            
            this.currOperand = expression;
            this.prevOperand = this.calcDone ? '' : this.prevOperand;
            this.calcDone = false;
        } else if (expression == ',' || this.isOperator(expression) || expression == BRACKET_OPEN) {
            this.currOperand += expression;
        } else if (this.currOperand.length < ASSETS.maxInput || this.termIsOpen) {
            this.currOperand += expression;
            this.currOperand = this.format$(this.currOperand);
        }
    }


    /**
     * Executes one of the inbuild math functions according to the operands.
     * @param {String} fnc one of the following functions: n! x² √ ± % 1/x 
     * - n!   - calculates and displays the factorial of the operand
     * - x²   - the square number of the operand
     * - √    - the square root of the operand
     * - ±    - toggles the sign of the operand
     * - %    - calculates and displays the percentage of the operend
     * - 1/x  - the reciproce of the displayed operand
     * @returns {Error} an error if the passed function fails. Otherwise the result is to be displayed.
     */
    executeFunction(fnc) {
        let result = null;
        switch (fnc) {
            case 'x²':
                result = this.round(Math.pow(this.currValue, 2));
                if (result == Infinity) return new Error(ERR_OVERFLOW);
                this.prevOperand = `(${this.currOperand})²`;
                break;
            case '√':
                if (this.currValue < 0) return new Error(ERR_NEGATIVE_ROOT);
                this.prevOperand = `√(${this.currOperand})`;
                result = Math.sqrt(this.currValue);
                break;
            case '±':
                if (this.currOperand.charAt(0) === '-') {
                    this.currOperand = this.currOperand.slice(1);
                } else {
                    this.currOperand = '-' + this.currOperand;
                }
                break;
            case '%':
                if (this.calcDone) this.prevOperand = '';
                if (this.prevValue) {
                    let tmp = this.prevOperand + this.format$(this.currValue) + ' %';
                    this.currOperand = this.format$(this.currValue / 100);
                    result = this.compute();
                    this.prevOperand = tmp;
                } else {
                    result = this.currValue / 100;
                    this.prevOperand = this.format$(this.currValue) + ' %';
                }
                break;
            case '1/x':
                if (this.currValue == 0) return new Error(ERR_DIV_BY_ZERO);
                this.prevOperand = `reciproc(${this.currOperand})`;
                result = 1 / (this.currValue);
                break;
            case 'n!':
                if (this.currValue < 0 || parseInt(this.currValue) != this.currValue) return new Error(ERR_UNDEFINED);
                result = this.factorial(this.currValue);
                if (result == Infinity) return new Error(ERR_OVERFLOW);
                this.prevOperand = `fact(${this.currOperand})`;
                break;
        }
        if (result) this.currOperand = this.format$(result);
        this.calcDone = result !== null;
    }


    /**
     * Factorial function.
     * @param {Number} number the number of the factorial to be calculated
     * @returns {Number | NaN} the calculated result if possible
     */
    factorial(number) {
        if (number > 170) return Infinity;
        if (number == 0 || number == 1) return 1;
        let result = number;
        while (number > 1) {
            number--;
            result *= number;
        }
        return result;
    }


    /**
     * Handles all possible memory operations and updated the display.
     */
    handleMemoryOperation() {
        const op = this.currentButton ? this.currentButton.slice(-1) : null;
        if (op == null || this.error) return;
        if (op == 'C') this.memory = 0;
        if (op == 'R' && this.memory !== 0) {
            if (this.operationIsPending) this.prevOperand = this.currOperand;
            this.currOperand = this.format$(this.memory);
        }
        if (op == 'S') this.memory = this.currValue;
        if (op == '+') this.memory += this.currValue;
        if (op == '-') this.memory -= this.currValue;
        this.memDisplay = (this.memory == 0) ? '' : 'M';
    }


    compute() {
        if (this.prevValue == 0 && this.currValue == 0 || this.operationIsPending == false) return;
        let operation = this.operationIsPending.replace(/[0-9]/g, '');
        if (operation.length > 1 && operation.startsWith('-')) operation = operation.slice(-1);
        const expression = this.prevValue.toString() + operation + this.currValue.toString();
        let result = this.evaluate(expression);
        if (result == Infinity) result = new Error(ERR_DIV_BY_ZERO);
        if (result instanceof Error) {
            this.updateDisplay(result);
            return;
        }
        result = this.round(result);
        this.prevOperand += this.format$(this.currValue);
        this.currOperand = this.format$(result);
        this.calcDone = true;
        this.operationIsPending = false;
        return result;
    }


    evaluate(expression) {
        expression = expression.replaceAll('÷', '/').
                    replaceAll('×', '*').
                    replaceAll(' mod ','%').
                    replaceAll(',','.');
                    //  replace(/^0+/, ''); // remove leading zeros!
        let result;
        try {
            result = new Function(`'use strict'; return (${expression})`)();
        } catch (err) {
            result = new Error(ERR_INVALID_EXP);
        }
        return this.round(result);
    }

    /**
     * Round half away from zero ('commercial' rounding)
     * Uses correction to offset floating-point inaccuracies.
     * Works symmetrically for positive and negative numbers.
     */
    round(num, decimalPlaces = this.decimals) {
        // only round floating point numbers, otherwise things may get worse!
        if (Number.isInteger(num)) return num;
        let p = Math.pow(10, decimalPlaces);
        let n = (num * p) * (1 + Number.EPSILON);
        return Math.round(n) / p;
    }


    format$(expression) {
        // const formatter = new Intl.NumberFormat(undefined, {
        //     maximumFractionDigits: this.decimals,
        //     useGrouping: this.groupDigits,
        // });
        if (this.groupDigits) {
            if (typeof expression == 'number') {
                expression = expression.toString().replaceAll('.',',');
            } else if (this.termIsOpen) {
                return expression;
            } else {
                expression = expression.replaceAll('.','');
            }
            const numParts = expression.split(','),
                  int = Number(numParts[0]),
                  integers = (int > Math.pow(10,20)) ? int : int.toLocaleString(),
                  decimals = numParts[1];
            return decimals ? integers + ',' + decimals : integers;
        } else {
            return expression.toString().replace('.',',');
        }
    }

    isOperator(expression = this.lastInput) {
        return OPERATORS.includes(expression);
    }


    /**
     * PUBLIC helper function. <br>
     *
     * Assigns a list of attributes as key-value pairs to the passed element.
     * @param {HTMLElement} element Element to assign the attributes to.
     * @param {object} attributes Object that contains key-value-pair(s) to be assigned to the passed element.
     * @usage  setAttributes (myDivContainer, { id: "myDivId", height: "100%", ...} )
     */
    setAttributes(element, attributes) {
        if (!element instanceof HTMLElement) return new Error(ERR_TYPEMISMATCH + 
            '{element} must be a valid HTML-element');
        if (typeof attributes !== 'object')  return new Error(ERR_TYPEMISMATCH + 
            '{attributes} must be an object, holding key-value pairs');
        for(const key in attributes) {
            element.setAttribute(key, attributes[key]);
        }
    }


    getStyle(element, styleProp) {
        const camelize = (str) => {
            return str.replace(/\-(\w)/g, (str, char) => {return char.toUpperCase()});
        };
        if (element.currentStyle) {
            return element.currentStyle[camelize(styleProp)];
        } else if (document.defaultView && document.defaultView.getComputedStyle) {
            return document.defaultView.getComputedStyle(element, null).getPropertyValue(styleProp);
        } else {
            return element.style[camelize(styleProp)];
        }
    }


    #renderCalculator() {
        const divPod = document.createElement('div');
        this.setAttributes(divPod,{id: 'divCalculatorPod', class: 'calculator-pod', hidden: ''});
        if (this.appendToParent) {
            this.parent.appendChild(divPod);
        } else {
            this.parent.insertBefore(divPod, this.parent.firstElementChild);
        }
        // creating all calculator containers
        ASSETS.containers.forEach(item => {
            const [id, cls]= item.split('|'),
                  div = document.createElement('div');
            this.setAttributes(div, {id: id, class: cls});
            divPod.append(div);
        });
        const settings = $('divCalcSettings');
        settings.innerHTML = ASSETS.templates.settings;
        settings.setAttribute('hidden','');
        $('divStatusbar').append($('divMemory'), $('divPrevOperand'));
        $('divDisplay').append($('divStatusbar'), $('divInput'));
        // creating all buttons
        ASSETS.buttons.forEach(btn => {
            const button = document.createElement('button'),
                 [caption, classList] = btn.split('|');
            if (classList) {
                button.setAttribute('class', classList);
                // if (classList.includes('enter')) {
                if (caption === '↵') {
                    button.toggleAttribute('hidden', !this.buddy);
                }
            }
            button.innerHTML = caption;
            button.classList.add('calc-btn');
            divPod.insertBefore(button, settings);
        });
        divPod.innerHTML += ASSETS.templates.buttonCog + ASSETS.templates.buttonClose;
        this.#addEventListeners();
    }


    #addEventListeners() {
        $('.calc-btn', true).forEach(btn => btn.addEventListener('click', () => {
            this.#handleButtonClick(btn.innerText);
        }));
        $('imgCalcSettings').addEventListener('click', () => this.#togglePodSettings());
        $('imgCloseCalc').addEventListener('click', (e) => {
            if ($('divCalcSettings').hasAttribute('hidden') == false) {
                this.#togglePodSettings(true);
            } else {
                this.hide();
            }
        });
        const inpDecimals = $('inpDecimals');
        inpDecimals.addEventListener('input', () => {
            $('spnDecimals').innerText = inpDecimals.value;
            this.decimals = Number(inpDecimals.value);
        });
        const inpDigits = $('inpGroupDigits');
        inpDigits.addEventListener('input', () => this.groupDigits = inpDigits.checked);

        $('divCalculatorPod').addEventListener('keyup', (e) => this.#handleKeyboard(e));
        $('inpButtonStyle').addEventListener('input', (e) => this.switchButtonStyle(Number(e.target.value)));
        // detect if we are in portrait or landscape mode
        window.matchMedia('(orientation: portrait)').addEventListener('change', e => {
            this.#orientation = (e.matches) ? 'portrait' : 'landscape';
            this.#displayWidth = this.display.clientWidth;
            // console.log(this.#orientation, 'width; ' + this.#displayWidth);
        });
    }


    switchButtonStyle(index) {
        const styles = ['rect','round','flat']; // can be extended: i. e. 'apple' and so on
        $('divCalculatorPod').setAttribute('data-buttons', styles[index]);
        $('lblButtonStyle').innerText = CAPTIONS['lblButtonStyle'][index][this.language];
        this.buttonStyle = index;
    }


    #handleKeyboard(e) {
        e.stopPropagation();
        let key = e.key;
        if ((key === '+' || key === '*') && e.shiftKey) key = key.replace(key,'±');
        key = key.replace('/','÷');
        key = key.replace('*','×');
        key = key.replace('Enter','=');
        key = key.replace('Backspace','⌫');
        key = key.replace('Delete','AC');
        key = key.replace('!','n!');
        key = key.replace('x','1/x');// reciproke
        key = key.replace('p','π');  // PI
        key = key.replace('r','√');  // root
        key = key.replace('²','x²'); // square
        this.#handleButtonClick(key);
    }

    #togglePodSettings(hide) {
        $('divCalcSettings').toggleAttribute('hidden', hide);
        if (hide) this.saveSettings();
    }
}