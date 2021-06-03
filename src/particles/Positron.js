import { Quantum } from './Quantum.js';

const POSITRON_MASS = 0.5;

export class Positron extends Quantum {
    constructor(x, y, z) {
        super(x, y, z, -1, POSITRON_MASS);
        this.color = { r: 0xFF, g: 0x33, b: 0x33 };
    }
}
