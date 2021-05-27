import { Particle } from './Particle.js';

const DARK_MASS = 10000000;

export class DarkParticle extends Particle {
    constructor(x, y, z) {
        super(x, y, z, 0, DARK_MASS);
        this.color = { r: 0x00, g: 0x00, b: 0x00 };
    }
}
