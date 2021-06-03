import { Quantum } from './Quantum.js';

export class Photon extends Quantum {
    constructor(x, y, z) {
        super(x, y, z, 0, 0);
        this.color = { r: 0xFF, g: 0xFF, b: 0x00 };
        this.drawPath = false;
    }
}
