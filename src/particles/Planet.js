import { Particle } from './Particle.js';

export class Planet extends Particle {
    constructor(x, y, z, mass = 1) {
        super(x, y, z, 0, mass);
        this.color = { r: 0x88, g: 0x88, b: 0x88 };
    }
}
