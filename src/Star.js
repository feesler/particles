import { Particle } from './Particle.js';

export class Star extends Particle {
    constructor(x, y, mass = 500000) {
        super(x, y, 0, mass);
        this.color = { r: 0xFF, g: 0xFF, b: 0x88 };
    }
}
