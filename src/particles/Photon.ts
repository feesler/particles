import { Quantum } from './Quantum.ts';
import { PHOTON_TYPE } from './types.ts';

const PHOTON_REFLECT_LIMIT = 2;

export class Photon extends Quantum {
    reflectCount: number;

    constructor(x: number, y: number, z: number) {
        super(x, y, z, 0, 0);
        this.color = { r: 0xFF, g: 0xFF, b: 0x00 };
        this.type = PHOTON_TYPE;
        this.reflectCount = 0;
        this.draw = false;
        this.drawPath = false;
        this.isQuantum = true;
    }

    reflect() {
        this.reflectCount += 1;
        if (this.reflectCount > PHOTON_REFLECT_LIMIT) {
            this.remove();
        }
    }
}
