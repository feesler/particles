import { Particle } from './Particle.js';

export class Molecule extends Particle {
    constructor(x, y, z, mass = 5000) {
        super(x, y, z, 0, mass);
        this.r = 1;
        this.color = { r: 0x44, g: 0x44, b: 0x44 };
        this.isQuantum = false;
    }
}
