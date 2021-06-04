import { Quantum } from './Quantum.js';
import { NEUTRON_TYPE } from './types.js';

const NEUTRON_MASS = 939;

export class Neutron extends Quantum {
    constructor(x, y, z) {
        super(x, y, z, 0, NEUTRON_MASS);
        this.type = NEUTRON_TYPE;
        this.color = { r: 0xCC, g: 0xCC, b: 0xCC };
    }
}
