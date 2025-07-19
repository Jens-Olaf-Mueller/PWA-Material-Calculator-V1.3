/**
 * npx pwa-asset-generator img/calculator.png img/icons --index index.html --manifest manifest.json
 */
export const APP_NAME = 'Material Calculator';
export const VERSION = '1.3.1';
export const DEF_SETTINGS = {
    language: 0,
    flags: ['german','italian','english','portugese','romanian'],
    inpShowLanguageButton: true,
    inpTheme: 0,
    inpShowHelp: true,
    inpShowThemeButton: false,
    inpUseDefaults: true,
    inpDefaultTileLength: 600,
    inpDefaultTileWidth: 300,
    inpDefaultJointsWidth: 3,
    inpDefaultJointsDepth: 10,
    inpBagSize: 25,
    inpPouchSize: 5,
    inpPackageSize: 6,
    selTrowel: 3.5,
    inpWaste: '',
    version: VERSION
};
export const gaugeUnits = ['mm','cm','m'];

// export const THEMES_CSS = {
//     bg1: ['#020204','#f4f4f4','#1f1e4f'],
//     bg2: ['#323234','#f7f7f7','#1f1e70'], // '#32307e' gradient light 1a1a8b
//     boxShadow: ['#010103','#f4f4f4','#1f1e4f'],
//     shadowDark: ['#040406','#b0b0b0','#0c0c20'],
//     shadowLight: ['#444449','#ffffff','#32307e'],
//     textColor: ['#888','#111','silver'],
//     disabledColor: ['#444','#666','#666'],
//     // accentColor: ['#5166d6','#009000','dodgerblue'],
//     accentColor: ['#5166d6','#008000','dodgerblue'],
//     requiredColor: ['tomato','red','darkorange'],
//     displayBgColor: ['#282c2f','#ecf0f3','#34335C'],
//     displayColor: ['darkgrey','#5166d6','darkgrey'],
//     displayTextShadow: ['unset',`-1px -1px 2px white, 2px 2px 2px #00000066;`,'unset'],
//     buttonMemBgColor: ['#555555','#bdbdbd','darkslateblue'],
//     buttonTextColor: ['#bbb', '#777','darkgrey']
// };

// ⌫

export const CALCULATOR_ASSETS = {
    buttons: [
        'MR|memory ls-c5',
        'MS|memory',
        'MC|memory',
        'M+|memory',
        'M-|memory',
        'AC|special ls-c5',
        '(|',
        ')|',
        ' mod |operator small-font',
        '⌫|special',
        'n!|operator ls-c5',
        'x²|operator',
        '√|operator',
        '±|operator',
        'π|operator',
        '7|ls-r2 ls-c1',
        '8|ls-r2',
        '9|ls-r2',
        '÷|operator ls-r2 ls-c4',
        '%|operator ls-c5',
        '4|ls-r3 ls-c1',
        '5|ls-r3',
        '6|ls-r3',
        '×|operator ls-r3 ls-c4',
        '1/x|operator',
        '1|ls-r4 ls-c1',
        '2|ls-r4',
        '3|ls-r4',
        '-|operator ls-r4 ls-c4',
        '=|special equals',
        '0|zero ls-r5',
        ',|ls-r5',
        '+|operator ls-r5 ls-c4',
        '↵|special enter'
    ],
    containers: [
        'divDisplay|display',
        'divStatusbar|status-bar',
        'divMemory|flx-start',
        'divPrevOperand|flx-end',
        'divInput|flx-end',
        'divCalcSettings|settings'
    ],
    templates: {
        settings: `<h2 id="h2CalcSettings">Einstellungen Taschenrechner</h2>
            <label class="left-aligned">
                <input id="inpButtonStyle" type="checkbox" role="switch">
                <span id="lblButtonStyle">Buttons rund</span>
            </label>
            <label class="left-aligned">
                <input id="inpGroupDigits" type="checkbox" role="switch" checked>
                <span id="lblGroupDigits">Zifferngruppierung</span>
            </label>
            <label>
                Dezimalstellen
                <input id="inpDecimals" type="range" class="slider" min="0" max="10" value="10">
                <span id="spnDecimals" class="unit" style="min-width: 1.5rem;text-align: right;">10</span>
            </label>`,
        buttonClose: `<div class="img-button" id="imgCloseCalc">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentcolor" id="svgCloseSettings">
                    <polygon points="400 145.49 366.51 112 256 222.51 145.49 112 112 145.49 222.51 256 112 366.51 145.49 400 256 289.49 366.51 400 400 366.51 289.49 256 400 145.49"/>
                </svg>
            </div>`,
        buttonCog: `<div class="img-button" id="imgCalcSettings">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" id="svgCalcSettings" stroke="currentcolor">
                    <path d="M262.29 192.31a64 64 0 1057.4 57.4 64.13 64.13 0 00-57.4-57.4zM416.39 256a154.34 154.34 0 01-1.53 20.79l45.21 35.46a10.81 10.81 0 012.45 13.75l-42.77 74a10.81 10.81 0 01-13.14 4.59l-44.9-18.08a16.11 16.11 0 00-15.17 1.75A164.48 164.48 0 01325 400.8a15.94 15.94 0 00-8.82 12.14l-6.73 47.89a11.08 11.08 0 01-10.68 9.17h-85.54a11.11 11.11 0 01-10.69-8.87l-6.72-47.82a16.07 16.07 0 00-9-12.22 155.3 155.3 0 01-21.46-12.57 16 16 0 00-15.11-1.71l-44.89 18.07a10.81 10.81 0 01-13.14-4.58l-42.77-74a10.8 10.8 0 012.45-13.75l38.21-30a16.05 16.05 0 006-14.08c-.36-4.17-.58-8.33-.58-12.5s.21-8.27.58-12.35a16 16 0 00-6.07-13.94l-38.19-30A10.81 10.81 0 0149.48 186l42.77-74a10.81 10.81 0 0113.14-4.59l44.9 18.08a16.11 16.11 0 0015.17-1.75A164.48 164.48 0 01187 111.2a15.94 15.94 0 008.82-12.14l6.73-47.89A11.08 11.08 0 01213.23 42h85.54a11.11 11.11 0 0110.69 8.87l6.72 47.82a16.07 16.07 0 009 12.22 155.3 155.3 0 0121.46 12.57 16 16 0 0015.11 1.71l44.89-18.07a10.81 10.81 0 0113.14 4.58l42.77 74a10.8 10.8 0 01-2.45 13.75l-38.21 30a16.05 16.05 0 00-6.05 14.08c.33 4.14.55 8.3.55 12.47z" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"/>
                </svg>
            </div>`
    },
    errors: [
        'Wrong parameter type',
        'Overflow',
        'Negative root',
        'Division by zero',
        'Invalid expression',
        'Not defined'
    ],
    mathOps: [' mod ','+-×÷ mod ','n! x² √ ± % 1/x',',','(',')'],
    maxInput: 17,
    defaultSettings: {
        appendToParent: false,        
        decimals: 10,
        groupDigits: true,
        memory: 0,
        DEF_FONTSIZE: 48,
        buttonStyle: 0 // 0 = rectangle, 1 = round
    }
}