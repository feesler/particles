import { Particle } from './Particle.js';

export class Star extends Particle {
    constructor(x, y, z, mass = 500000) {
        super(x, y, z, 0, mass);
        if (mass >= 1000000000) {
            this.color = { r: 0x4D, g: 0xBE, b: 0xFF };
        } else {
            this.color = { r: 0xEE, g: 0xB0, b: 0x2A };
        }
    }
}
