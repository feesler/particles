import { Particle } from './Particle.ts';
import { DARK_TYPE } from './types.ts';

const DARK_MASS = 10000000;

export class DarkParticle extends Particle {
    constructor(x: number, y: number, z: number) {
        super(x, y, z, 0, DARK_MASS);
        this.color = { r: 0x00, g: 0x00, b: 0x00 };
        this.type = DARK_TYPE;
        this.draw = false;
    }
}
