import { Quantum } from './Quantum.ts';
import { PROTON_TYPE } from './types.ts';

const PROTON_MASS = 938;

export class Proton extends Quantum {
    constructor(x: number, y: number, z: number) {
        super(x, y, z, 1, PROTON_MASS);
        this.type = PROTON_TYPE;
        this.color = { r: 0xFF, g: 0x88, b: 0x88 };
        this.isQuantum = true;
    }
}
