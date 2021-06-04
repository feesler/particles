import { Quantum } from './Quantum.js';
import { PHOTON_TYPE } from './types.js';

const PHOTON_REFLECT_LIMIT = 2;

export class Photon extends Quantum {
    constructor(x, y, z) {
        super(x, y, z, 0, 0);
        this.color = { r: 0xFF, g: 0xFF, b: 0x00 };
        this.type = PHOTON_TYPE;
        this.reflectCount = 0;
        this.drawPath = false;
    }

    reflect() {
        this.reflectCount++;
        if (this.reflectCount > PHOTON_REFLECT_LIMIT) {
            this.remove();
        }
    }
}
