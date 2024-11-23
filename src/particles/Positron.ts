import { Quantum } from './Quantum.ts';
import { POSITRON_TYPE } from './types.ts';

const POSITRON_MASS = 0.5;

export class Positron extends Quantum {
    constructor(x: number, y: number, z: number) {
        super(x, y, z, 1, POSITRON_MASS);
        this.type = POSITRON_TYPE;
        this.color = { r: 0xFF, g: 0x33, b: 0x33 };
        this.isQuantum = true;
    }
}
