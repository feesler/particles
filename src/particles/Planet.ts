import { Particle } from './Particle.ts';
import { PLANET_TYPE } from './types.ts';

export class Planet extends Particle {
    constructor(x: number, y: number, z: number, mass: number = 1) {
        super(x, y, z, 0, mass);
        this.color = { r: 0x88, g: 0x88, b: 0x88 };
        this.type = PLANET_TYPE;
        this.isQuantum = false;
    }
}
