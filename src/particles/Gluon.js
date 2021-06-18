import { Quantum } from './Quantum.js';
import { GLUON_TYPE } from './types.js';

export class Gluon extends Quantum {
    constructor(x, y, z) {
        super(x, y, z, 0, 0);
        this.color = { r: 0x00, g: 0xFF, b: 0x00 };
        this.type = GLUON_TYPE;
        this.draw = false;
    }
}
