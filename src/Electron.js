import { Particle } from './Particle.js';

const ELECTRON_MASS = 0.5;

export class Electron extends Particle {
    constructor(x, y) {
        super(x, y, -1, ELECTRON_MASS);
        this.color = { r: 0x88, g: 0x88, b: 0xFF };
    }
}
