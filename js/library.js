/**
 * Universal 'all-in-one' function that unites the DOM-functions
 * => document.getElementById
 * => document.getElementsByTagName
 * => document.getElementsByClassName
 * => document.getElementsByName
 * => document.querySelectorAll
 *  
 * prepend 'export' if you wanna import the function in a module!
 * 
 * @param {string} selector any valid CSS selector
 * @param {number | string} child optional,
 * determines which child of the found nodelist or HTML-collection
 * is supposed to be returned. A number returns the child of the given index. A tilde '~' or the
 * string expression ':last-child' returns the last child of the list / collection.
 * @returns a single element (if selector is a valid ID or child is specified)
 * in all other cases a zero-based nodelist or HTML-collection, matching the selector-parameter
 * If the list contains ONLY ONE element, this element is returned only!
 * @usage   $('main-content')     -   returns an element with ID 'main-content'
 *          $('div','~')          -   returns the last div-container of the document
 *          $('a',0)              -   returns the first link (<a>-element)
 *          $('div.myClass')      -   returns a list with all div's containing class 'myClass'
 *          $('div.myClass','~')  -   returns last div containing class 'myClass'
 *          $('.clsNames',3)      -   returns the 4th(!) child of the wanted class list
 *          $('input[type=text]') -   returns a list with all input elements, being text fields
 *          $('[name]')           -   returns a list with all elements, having a 'name' attribute
 */
export default function $(selector, returnArray = false, child) {
    // defining two helper functions:
    const getElements = (nodeList, child, returnArray) => {
        // we don't return a node list, with only ONE element!
        // but this single element instead, except from param "returnArray == true"
        if (nodeList.length == 1 && returnArray === false) return nodeList[0];
        // is the last child wanted?
        if (child == '~' || child == ':last-child') child = nodeList.length - 1;
        // do we have a valid child-index?
        child = (Number.isFinite(parseInt(child)) && child >= 0) ? Number(child) : false;
        if (returnArray) {
             // ATTENTION! 'if (child)...' does not work since child can be 0!
            if (child === false) return Array.from(nodeList);
            // return Array.from(nodeList)[child];
            return nodeList[child];
        }
        // return (child === false) ? nodeList : nodeList[child];
        if (nodeList.length == 0 ) return null;
        return (child === false) ? nodeList : nodeList[child];
    }

    // allows a shorthand syntax of just the selector and the child: $('.myclass', 1)
    if (typeof returnArray === 'string' || typeof returnArray === 'number') {
        child = returnArray;
        returnArray = false;
    }

    // query-selector provided?
    const querySelector = ['[', '.', '#', ':', '>'].some(char => {return selector.includes(char)});
    if (querySelector) {
        return getElements(document.querySelectorAll(selector), child, returnArray);
    }

    // now search for ID...
    const element = document.getElementById(selector);
    if (element) return element; // ID was found!

    // no ID! continue in HTML-tags...
    const htmlTags = document.getElementsByTagName(selector);
    if (htmlTags.length > 0) return getElements(htmlTags, child, returnArray);

    // is the selector a class...?
    const classNames = document.getElementsByClassName(selector);
    if (classNames.length > 0) return getElements(classNames, child, returnArray);

    // ...or is it a name finally?
    const names = document.getElementsByName(selector);
    if (names.length > 0) return getElements(names, child, returnArray);
    return null;
}

/**
 * Checks properly (!), if the given expression is numeric.
 * recognizes: undefined, NaN, Null, infinity etc.
 * @param {number | numeric string} expression 
 * @param {boolean} allowStringNumbers optional, tells if string literals are allowed or not (default)
 * @returns true | false
 */
export function isNumeric(expression, allowStringNumbers) {
    if (allowStringNumbers == true) return Number.isFinite(parseFloat(expression));
    return Number.isFinite(expression);
}


/**
 * Global event listener.
 * Can be enhanced by a string-array of events to install a bunch of different events at once
 * @param {string} type the type of the event (i.e. 'input', 'click' etc.)
 * @param {string} selector a valid CSS selector that defines the target for the listener
 * @param {function} callback the event handler
 * @param {HTMLElement} parent element the event listener is supposed to be installed on
 * @param {object} options common ev.-listener options like {bubbles: true}
 * @see {@link https://www.mediaevent.de/javascript/event-delegation.html}
 */
export function addGlobalEventListeners(type, selector, callback, parent = document, options) {
    parent?.addEventListener(type, e => {
        if (e.target.matches(selector)) callback(e);
    }, options);
}

/**
 * @description
 * Extends the Math-Object by a special round-function that allows to
 * round a given number to a given amount of decimal digits
 * @param {number} number numeric expression
 * @param {number} decimals count of decimal digits
 * @returns the rounded number with assignet decimal digits
 */
Math.roundDec = function(number, decimals = 0) {
    const dec = decimals * 10;
    if (dec == 0) return Math.round(number + Number.EPSILON);
    return Math.round((number + Number.EPSILON) * dec) / dec;
}

/**
 * loads HTML-templates at run time to the page.
 * Iterates through all elements containing the attribute 'w3-include-html'.
 * i.e.:
 *
 * header w3-include-html="templates/header.html" will load a given header
 */
export async function includeHTML() {
    const W3_ATTR = 'w3-include-html';
    let includeElements = document.querySelectorAll(`[${W3_ATTR}]`);
    if (includeElements.length == 0) return; // avoiding endless loop!
    for (let i = 0; i < includeElements.length; i++) {
        const element = includeElements[i];
        let file = element.getAttribute(W3_ATTR),
            response = await fetch(file);
        if (response.ok) {
            element.innerHTML = await response.text();
            element.removeAttribute(W3_ATTR);
        } else {
            element.innerHTML = `Page not found: "${file}"`;
        }
    }
    await includeHTML();
}