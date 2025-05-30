import { Particle } from './Particle.ts';

export class Molecule extends Particle {
    constructor(x: number, y: number, z: number, mass: number = 5000) {
        super(x, y, z, 0, mass);
        this.r = 1;
        this.color = { r: 0x44, g: 0x44, b: 0x44 };
        this.isQuantum = false;
    }
}
