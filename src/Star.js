import { Particle } from './Particle.js';

export class Star extends Particle {
    constructor(x, y) {
        super(x, y, 0, 500000);
        this.color = { r: 0xFF, g: 0xFF, b: 0x88 };
    }
}
