/**
 * Used ressources:
 * https://hype4.academy/tools/neumorphism-generator
 * https://icon-icons.com/
 */

import $, { includeHTML } from './library.js';
import { APP_NAME, VERSION, DEF_SETTINGS, gaugeUnits } from './constants.js';
import { CAPTIONS } from './languages.js';
import Material from './material_class.js';
import Calculator from './calculator_class.js';

const SETTINGS = loadSettings(APP_NAME);
const CALCULATOR = new Calculator(document.body, null, false);
const LANGUAGES_COUNT = 5; // mod operator for supported languages
const TILES = 0,
      LEVELLING = 1,
      SCREED = 2;

let inpArea, inpLength, inpWidth, btnSend, btnClose, btnRefresh, btnLanguage, btnHelp, btnMode;
const arrPacks = [];

/**
 * This starts the application after all content has been loaded
 */
window.addEventListener('DOMContentLoaded', runApp);

async function runApp() {
    await includeHTML();
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('../serviceWorker.js', {
            updateViaCache: 'none',
            scope: '../',
            type: 'module'
        })
        .then(
            // reg is an registration object and can be output or used for any required information
            (reg) => {
                const now = new Date().toUTCString().substring(5).slice(0, -4);
                console.log(`Service worker for ${APP_NAME} registered on ${now}`) // , reg
            })
        .catch((error) => console.warn(`Service worker registration failed: ${error}`));

        // navigator.serviceWorker.ready.then((registration) => {
        //     registration.active.postMessage({ message: 'Hello from the page!' });
        // });
    } else {
        console.warn('Service worker not supported!');
    }

    inpArea = $('inpArea');
    inpLength = $('inpLength');
    inpWidth = $('inpWidth');
    btnSend = $('imgSend');
    btnClose = $('imgClose');
    btnRefresh = $('imgRefresh');
    btnLanguage = $('btnLanguage');
    btnHelp = $('imgHelp');
    btnMode =$('btnMode');
    $('#lstPackageSize option').forEach(opt => arrPacks.push(Number(opt.value)));
    setEventListeners();
    applySettings(SETTINGS);
    CALCULATOR.buddy = inpArea;
}


function updateApp() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
            for (const reg of registrations) {
                // reg.unregister();
                console.log(reg)
            }
        });
        console.log('Service worker updated!');
    } else {
        console.warn('Service worker not supported!');
    }
}


function setEventListeners() {
    inpArea.addEventListener('buddychanged', enableCalcButton);
    [inpArea, inpLength, inpWidth].forEach(input => {
        input.addEventListener('touchstart', toggleAreaControls, {passive: true});
        input.addEventListener('input', displayCalculatedArea);
    });
    $('divArea').addEventListener('click', (e) => toggleAreaControls(e), false);

    $('input[type="text"]').forEach(input => {
        input.addEventListener('keypress', (e) => validateInput(e));
        input.addEventListener('input', () => enableCalcButton(input));
    });
    $('.unit-changer', true).forEach(btn => {
        btn.addEventListener('touchstart', () => switchUnit(btn), {passive: true});
        btn.addEventListener('mousedown', () => switchUnit(btn));
    });

    $('svgCalculator').addEventListener('touchstart', () => {
        CALCULATOR.show();
        $('.special', 0).focus(); // AC
    }, {passive: true});

    $('imgSettings').addEventListener('click', () => toggleSettings());
    $('imgCloseSettings').addEventListener('click', () => toggleSettings(true));

    btnSend.addEventListener('click', () => showResult(Number($('inpCategory').value)));
    btnRefresh.addEventListener('click', () => location.reload());
    btnLanguage.addEventListener('click', applyLanguage);
    btnHelp.addEventListener('click', toggleGUI);
    btnMode.addEventListener('click', (e) => {
        const inpTheme = $('inpTheme'),
              mode = 1 - Number(inpTheme.value);
        inpTheme.value = mode;
        switchTheme(mode);
    });
    $('inpTheme').addEventListener('input', (e)=> switchTheme(Number(e.target.value)));
    $('inpLanguage').addEventListener('input', (e)=> applyLanguage(Number(e.target.value)));    

    btnClose.addEventListener('click', toggleGUI);

    ['inpShowHelp','inpShowLanguageButton','inpShowThemeButton',
     'inpUseDefaults','inpContactLayer','inpDiagonal'].forEach(btn => {
        switchSetting(btn);
    });

    ['inpBagSize','inpPouchSize','inpPackageSize'].forEach(input => {
        $(input).addEventListener('input', (e) => displayPackSizes(e.target));
    });
    $('inpCategory').addEventListener('input', (e) => toggleMaterialType(e));
}


function toggleMaterialType(e) {
    const ind = Number(e.target.value),
          materialType = ['tiles','levelling','screed'][ind],
          elements = $('[data-type]'),
          inpHeight = $('inpHeight');
    elements.forEach(el => {
        const hide = !el.getAttribute('data-type').includes(materialType);// !== materialType;
        el.toggleAttribute('hidden', hide);
    });
    inpHeight.value = '';
    inpHeight.toggleAttribute('required', (materialType !== 'tiles'));
    $('spnHeight').innerText = (materialType === 'screed') ? 'cm' : 'mm';
    enableCalcButton();
    applyLanguage(SETTINGS.language);
}


function switchSetting(id) {
    const switchBtn = $(id);
    switchBtn.addEventListener('input', () => {
        const state = switchBtn.checked;
        switchBtn.toggleAttribute('checked', state);
        if (id == 'inpShowLanguageButton') {
            btnLanguage.toggleAttribute('hidden', !state);
            SETTINGS.inpShowLanguageButton = state;
        } else if (id == 'inpShowHelp') {
            btnHelp.toggleAttribute('hidden', !state);
            SETTINGS.inpShowHelp = state;
        } else if (id == 'inpShowThemeButton') {
            btnMode.toggleAttribute('hidden', !state);
            SETTINGS.inpShowThemeButton = state;
        } else if (id == 'inpUseDefaults') {
            const defaults = $('[id^="inpDefault"]');
            defaults.forEach(inp => inp.toggleAttribute('disabled', !state));
            SETTINGS.inpUseDefaults = state;
            applyDefaults(SETTINGS);
            btnSend.toggleAttribute('disabled', !state);
        }
    });
}


function applySettings(settings = DEF_SETTINGS) {
    for (const id in settings) {
        const value = settings[id];
        if (id.startsWith('inp') || id.startsWith('sel')) {
            const ctrl = $(id);
            if (typeof value === 'boolean') {
                ctrl.checked = value;
            } else {
                ctrl.value = value;
            }
            // trigger the input event to apply setting controls!
            ctrl.dispatchEvent(new Event('input'));
        }
    }
    applyDefaults(settings);
    applyLanguage(settings.language);
    switchTheme(settings.inpTheme);
}


function applyDefaults(settings = DEF_SETTINGS) {
    const state = settings.inpUseDefaults;
    ['selTrowel','inpWaste','TileLength','TileWidth','JointsWidth','JointsDepth'].forEach((id, i) => {
        const inp = i < 2 ? id : `inp${id}`,
              key = i < 2 ? id : `inpDefault${id}`,
              val = i == 0 ? '3.5' : '';
        $(inp).value = state ? settings[key] : val;
    });
}

function applyLanguage(language) {
    const lang = (typeof language == 'number') ? language : (SETTINGS.language + 1) % LANGUAGES_COUNT,
          imgFlag = $('imgLanguage');
    SETTINGS.language = lang;
    saveSettings();
    $('inpLanguage').value = lang;
    imgFlag.src = `./img/${SETTINGS.flags[lang]}.png`;
    imgFlag.alt = SETTINGS.flags[lang];
    for (const id in CAPTIONS) {
        const elmt = $(id);
        if (elmt) {
            const caption = CAPTIONS[id][lang];
            if (caption) {
                if (caption instanceof Array) {
                    const index = elmt.previousElementSibling.value; // value of the slider!
                    elmt.innerHTML = caption[index];
                } else {
                    elmt.innerHTML = caption;
                }
            }
        }
    }
    $('parAbout').innerHTML = `${APP_NAME} v${VERSION}`;
}


function displayPackSizes(slider) {
    let unit = ' kg';
    if (slider.id === 'inpPackageSize') {
        unit = ' Stk';
        const closest = arrPacks.reduce((prev, curr) => {
            return (Math.abs(curr - slider.value) < Math.abs(prev - slider.value) ? curr : prev);
        });
        slider.value = closest;
    }
    slider.nextElementSibling.innerText = slider.value + unit;
    SETTINGS[slider.id] = slider.value;
}


function loadSettings(key = APP_NAME) {
    const currSettings = JSON.parse(localStorage.getItem(key + '_settings'));
    if (!currSettings || currSettings.version !== DEF_SETTINGS.version) {
        const newSettings = Object.assign({}, currSettings, DEF_SETTINGS);
        saveSettings(APP_NAME, newSettings);
        updateApp();
        return newSettings;
    }
    return currSettings ? currSettings : DEF_SETTINGS;
}


function saveSettings(key = APP_NAME, settings = SETTINGS) {
    localStorage.setItem(`${key}_settings`, JSON.stringify(settings));
}


function toggleSettings(close = false) {
    $('divSettings').toggleAttribute('hidden', close);
    $('divPod').toggleAttribute('hidden', !close);
    if (close) {
        ['inpDefaultTileLength','inpDefaultTileWidth',
        'inpDefaultJointsDepth','inpDefaultJointsWidth',
        'selTrowel','inpWaste'].forEach(key => SETTINGS[key] = $(key).value);
        applyDefaults(SETTINGS);
        saveSettings();
    }
}


function toggleGUI() {
    const btn = this,
          name = btn?.id.substring(3).toLowerCase() || '';
    $('divPod').toggleAttribute('hidden',(btn !== btnClose));
    $('divHelp').toggleAttribute('hidden', btn === btnClose || name !== 'help');
    $('divResult').toggleAttribute('hidden', (btn === btnClose) || name !== '');    
    btnClose.toggleAttribute('hidden',(btn === btnClose));
}


function switchUnit(btn) {
    const input = document.activeElement; // keep focus on corresponding input element!
    let i = gaugeUnits.indexOf(btn.nextElementSibling.innerText);
    i = (i + 1 ) % gaugeUnits.length;
    btn.nextElementSibling.innerText = gaugeUnits[i];
    let factor;
    if (input.value) {
        switch (i) {
            case 0: factor = 1000; break;
            case 1: factor = 0.1; break;
            case 2: factor = 0.01; break;
        }
        const value = Number(input.value.replace(',','.')),
              decimals = i ? i + 1 : 0;
        input.value = (value * factor).toFixed(decimals).replace('.',',');
    }
    input.focus();
}


function validateInput(evt) {
    const keyCode = evt.keyCode,
          hasComma = evt.target.value.includes(','),
          unit = evt.target.parentElement.lastElementChild,
          commaAllowed = (unit.innerText == 'm' || unit.innerText == 'm²') && !hasComma;
    if (keyCode > 31 && (keyCode < 48 || keyCode > 57) && keyCode !== 44 || 
       (keyCode == 44 && !commaAllowed)) evt.preventDefault();    
}


function enableCalcButton() {
    let isValid = Number(inpArea.value.replace(',','.')) > 0.4;
    if (!isValid) {
        $('[required]').forEach(fld => {
            isValid = (isValid && Boolean(fld.value));
        });
    }
    btnSend.toggleAttribute('disabled', !isValid);
}


function showResult(category) {
    if (btnSend.hasAttribute('disabled')) return;
    toggleGUI();
    const grid = $('divResultGrid');
    const MATERIAL = assignInputs(new Material(category)),
          area = MATERIAL.area.toString().replace('.',','),
          lng = SETTINGS.language;
    grid.innerHTML = `
        <h1>${CAPTIONS.spnCalcType[lng][category]}</h1>
        <h2>${CAPTIONS.h1ResultArea[lng]} ${area} m²</h2>`;

    if (category == TILES) {
        ['spnGlue','spnGrout','spnTiles'].forEach((cell, i) => {
            const key = cell.substring(3).toLocaleLowerCase(),
                  bag = i < 2 ? CAPTIONS.spnBags[lng] : 'Pack',
                  size = i == 0 ? '(' + SETTINGS.inpBagSize + ' kg)' :
                         i == 1 ? '(' + SETTINGS.inpPouchSize + ' kg)' :
                         i == 2 ? '(' + MATERIAL.tilesPackSize + ' pcs)' : '';
            grid.innerHTML += `
                <span>${CAPTIONS[cell][lng]} ${size}</span>
                <span class="values-ral">${MATERIAL[key]}</span>
                <span class="res-unit">${['kg','kg','Stk'][i]}</span>
                <span class="bags">${MATERIAL.bags(key)}  ${bag}</span>`;
        });
        return;
    }
    const cell = ['spnTiles','spnLevel','spnScreed'][category],
            key = cell.substring(3).toLocaleLowerCase(),
            idx = category == LEVELLING ? key + 'Compound' : key;
    grid.innerHTML += `
        <span>${CAPTIONS[cell][lng]}</span>
        <span class="values-ral">${MATERIAL[idx]}</span>
        <span class="res-unit">kg</span>
        <span class="bags">${MATERIAL.bags(key)}  ${CAPTIONS.spnBags[lng]}</span>
        <span>${CAPTIONS.spnWater[lng]}</span>
        <span class="values-ral">${MATERIAL.water * MATERIAL.bags(key)}</span>
        <span class="res-unit">ltr</span>`;
}


function assignInputs(material) {
    if (material.category == LEVELLING) {
        const [density, water] = $('selBrand').value.split(':').map(Number);
        material.density = density * 1000;
        material.water = water;
    } else if (material.category == SCREED) {
        material.density = 2000;
        material.water = 2; // 2 litres water per bag screed!
    }
    material.areaLength = convertUnit(inpLength);
    material.areaWidth = convertUnit(inpWidth);
    material.areaManual = !inpArea.hasAttribute('disabled');
    material.area = material.areaManual ? parseFloat(inpArea.value.replace(',','.')) : 0;    
    material.trowel = Number($('selTrowel').value);
    material.contactLayer = $('inpContactLayer').checked;
    material.diagonal = $('inpDiagonal').checked;
    material.levelHeight = convertUnit($('inpHeight'));
    material.tileLength = Number($('inpTileLength').value);
    material.tileWidth = Number($('inpTileWidth').value);
    material.offcut = Number($('inpWaste').value);
    material.jointDepth = Number($('inpJointsDepth').value);
    material.jointWidth = Number($('inpJointsWidth').value);
    material.bagSize = material.category == TILES ? Number(SETTINGS.inpBagSize) : 25;
    material.pouchSize = Number(SETTINGS.inpPouchSize);
    material.tilesPackSize = Number($('inpPackageSize').value);
    return material;
}


function toggleAreaControls(evt) {
    if (evt.target.hasAttribute('disabled')) {
        inpLength.toggleAttribute('disabled');
        inpWidth.toggleAttribute('disabled');
        inpArea.toggleAttribute('disabled');
    }
    const areaManual = (evt.target === inpArea);
    inpLength.toggleAttribute('required', !areaManual);
    inpWidth.toggleAttribute('required', !areaManual);
}


function displayCalculatedArea(evt) {
    const areaManual = (evt.target === inpArea);
    let length = convertUnit(inpLength),
        width = convertUnit(inpWidth);
    const area = areaManual ? convertUnit(inpArea).toString() : (length * width).toFixed(2);

    if (!isNaN(area) && (Number(area) > 0.4 || areaManual)) {
        if (!areaManual) inpArea.value = area.replace('.',',');
        const isValid = (Number(area) > 0.4) && 
              $('inpTileLength').value && $('inpTileWidth').value &&              
              $('inpJointsWidth').value && $('inpJointsDepth').value;
        if (isValid) {
            btnSend.removeAttribute('disabled');
        } else {
            btnSend.setAttribute('disabled','');
        }
    } else {
        inpArea.value = '';
        btnSend.setAttribute('disabled','');
    }
}

function convertUnit(element) {
    let value = parseFloat(element.value.replace(',','.'));
    const unit = element.parentElement.lastElementChild,
          index = gaugeUnits.indexOf(unit.innerText);
    if (index == 0) return value / 1000;
    if (index == 1) return value / 100;
    return value;
}


function switchTheme(style) {
    const root = $('html[data-theme]'),
          theme = ['dark','light'][style];
    root.setAttribute('data-theme', theme);
    SETTINGS.inpTheme = style;
    saveSettings();
}