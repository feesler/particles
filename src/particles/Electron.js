import { Quantum } from './Quantum.js';
import { ELECTRON_TYPE } from './types.js';

const ELECTRON_MASS = 0.5;

export class Electron extends Quantum {
    constructor(x, y, z) {
        super(x, y, z, -1, ELECTRON_MASS);
        this.type = ELECTRON_TYPE;
        this.color = { r: 0x88, g: 0x88, b: 0xFF };
    }
}
