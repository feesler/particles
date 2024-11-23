import { Quantum } from './Quantum.ts';
import { GLUON_TYPE } from './types.ts';

export class Gluon extends Quantum {
    constructor(x: number, y: number, z: number) {
        super(x, y, z, 0, 0);
        this.color = { r: 0x00, g: 0xFF, b: 0x00 };
        this.type = GLUON_TYPE;
        this.draw = false;
        this.isQuantum = true;
    }
}
