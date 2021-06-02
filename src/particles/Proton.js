import { Quantum } from './Quantum.js';

const PROTON_MASS = 938;

export class Proton extends Quantum {
    constructor(x, y, z) {
        super(x, y, z, 1, PROTON_MASS);
        this.color = { r: 0xFF, g: 0x88, b: 0x88 };
    }
}
