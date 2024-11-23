import { Quantum } from './Quantum.ts';
import { NEUTRON_TYPE } from './types.ts';

const NEUTRON_MASS = 939;

export class Neutron extends Quantum {
    constructor(x: number, y: number, z: number) {
        super(x, y, z, 0, NEUTRON_MASS);
        this.type = NEUTRON_TYPE;
        this.color = { r: 0xCC, g: 0xCC, b: 0xCC };
        this.isQuantum = true;
    }
}
