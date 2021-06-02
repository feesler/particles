import { Particle } from './Particle.js';

export class Star extends Particle {
    constructor(x, y, z, mass = 500000) {
        super(x, y, z, 0, mass);
        this.r = Math.log(mass);
        this.color = this.getColor(mass);
    }

    getColor(mass) {
        const shift = Math.log(mass);

        if (mass >= 1000000000) {
            return { r: 0xFF - Math.round(shift), g: 0xFF - Math.round(shift / 2), b: 0xFF };
        }

        return { r: 0xFF, g: Math.round(shift * 10), b: 0 };
    }

    setMass(mass) {
        super.setMass(mass);

        this.color = this.getColor(mass);
    }
}
