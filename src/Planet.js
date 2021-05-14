import { Particle } from './Particle.js';

export class Planet extends Particle {
    constructor(x, y) {
        super(x, y, 0, 1);
        this.color = { r: 0x88, g: 0x88, b: 0x88 };
    }
}
