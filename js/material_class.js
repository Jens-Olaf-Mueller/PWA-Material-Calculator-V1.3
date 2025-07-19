export default class Material {
    currentUnit = 0; // = mm
    units = ['mm','cm','m'];
    areaManual = false;
    areaLength = 0;
    areaWidth = 0;
    tileLength = 0;
    tileWidth = 0;
    offcut = 0;
    trowel = 0;
    contactLayer = false;
    diagonal = false;
    levelHeight = 0;
    jointWidth = 0;
    jointDepth = 0;
    pouchSize = 5;
    bagSize = 25;
    tilesPackSize = 6;
    water = 0;

    get jointLength() {
        if (this.diagonal) {
            // diagonal = mehr Fugenlänge! Diagonale eines Rechteckes ist länger!
            return parseFloat(Math.SQRT2 / Number(this.tileWidth / 1000) + Math.SQRT2 / Number(this.tileLength / 1000) + Math.SQRT2 / 2);
        } else {
            return parseFloat(1 / Number(this.tileWidth / 1000) + 1 / Number(this.tileLength / 1000)); 
        }
    }

    #density = 1700;
    get density() {return this.#density;}  // 1700 ist die Dichte in kg/m³
    set density(newVal) {
        this.#density = newVal;
    }

    #area = 0;
    get area() {
        if (this.areaManual) {
            return Number(this.#area);
        } else {
            const unit = Number(this.currentUnit) || 1;
            return Number(((this.areaLength / unit) * (this.areaWidth / unit)).toFixed(2));
        }
    }
    set area (newVal) {
        if (this.areaManual) this.#area = newVal;
    }

    get glue() {
        const glue = this.area * this.trowel;
        return this.contactLayer ? Math.roundDec(glue + glue * 0.25) : Math.roundDec(glue);
    }

    // TODO seperate grout density! (const of 1700!)
    get grout() {
        return Math.roundDec(this.area * this.jointLength * this.jointWidth / 1000 * this.jointDepth / 1000 * 1700 * 1.05, 1);
    }

    get levelCompound() {
        // return Math.roundDec(this.area * this.levelHeight / 1000 * this.density);
        return Math.roundDec(this.area * this.levelHeight * this.density);
    }

    get screed() {
        // return Math.roundDec(this.area * this.levelHeight / 1000 * 2000);
        return Math.roundDec(this.area * this.levelHeight * 2000);
    }

    get tilesPerSQM() {
        const tileSize = (this.tileLength / 1000) * (this.tileWidth / 1000);
        return (tileSize == 0) ? 0 : 1 / tileSize;
    }
    get tiles() {
        const amount = Math.ceil(this.tilesPerSQM * this.area);
        return Math.ceil(amount + amount * this.offcut / 100);
    }

    constructor(category = 0) {
        this.category = category; // 0 = tiles | 1 = levelling | 2 = screed
        // super(form);
    }

    /**
     * Calculates the number of required bags depending on the passed material.
     * @param {string} material 
     * @returns number | empty string
     */
    bags(material = 'glue') {
        if (material == 'glue') {
            return Math.ceil(this.glue / this.bagSize);
        } else if (material == 'grout') {
            return Math.ceil(this.grout / this.pouchSize);
        } else if (material.includes('level')) {
            return Math.ceil(this.levelCompound / this.bagSize);
        } else if (material.includes('screed')) {
            return Math.ceil(this.screed / this.bagSize);
        } else if (material.includes('tiles')) {
            return Math.ceil(this.tiles / this.tilesPackSize);
        } else {
            return '';
        }
    }

    /**
     * 
     */
    applyChanges() {
        let entries = this.#readFormData();
        const objPb = {}; // create a property object!
        for (const prop in entries) {
            const value = entries[prop];
            if (value !== undefined) {
                objPb[prop] = (value === 'on') ? true : value;
            }
        }
        this.#assignProperties(objPb);
    }

    // https://stackabuse.com/convert-form-data-to-javascript-object/
    #readFormData() {
        const frmData = new FormData(this.form),
              frmEntries = Object.fromEntries(frmData.entries());
        // handling all named checkboxes to get also UNchecked boxes!
        Array.from($('[type="checkbox"][name]')).map(box => {
            frmEntries[box.name] = box.checked;
        });
        return frmEntries;
    }

    /**
     * Private method.
     * Assigns the passed settings to the class.
     * If no settings are available (i.e. first start), default settings are used.
     * @param {object} settings settings to be assigned to the class
     */
    #assignProperties(settings) {
        if (settings == null) return;
        for (const prop in settings) {
            if (this.hasOwnProperty(prop) || this.hasOwnSetter(prop)) {
                this[prop] = settings[prop];
            }
        }
    }

    /**
     * Helper function for #assignProperties.
     * Checks if the class has a setter with the given name. 
     * @param {string} property Name of the property we want to determine if it has a setter
     * @returns true | false
     */
    hasOwnSetter(property) {
        const setters = Object.entries(Object.getOwnPropertyDescriptors(Material.prototype))
            .filter(([key, descriptor]) => typeof descriptor.set === 'function').map(([key]) => key)
        return setters.includes(property);
    }

}