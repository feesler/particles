import { Vector } from './Vector.js';

export class Particle {
    constructor(x, y, z, charge, m) {
        this.pos = new Vector(x, y, z);
        this.force = new Vector(0, 0, 0);
        this.velocity = new Vector(0, 0, 0);

        this.m = m;
        this.charge = charge;

        this.color = { r: 0xFF, g: 0xFF, b: 0xFF };
    }

    speed() {
        return Math.sqrt(
            this.velocity.x * this.velocity.x
            + this.velocity.y * this.velocity.y
            + this.velocity.z * this.velocity.z
        );
    }

    attract(particle) {
        return Math.sign(this.charge) != Math.sign(particle.charge);
    }

    distanceTo(particle) {
        const dx = Math.abs(this.pos.x - particle.pos.x);
        const dy = Math.abs(this.pos.y - particle.pos.y);
        const dz = Math.abs(this.pos.z - particle.pos.z);

        return new Vector(dx, dy, dz);
    }

    orientationTo(particle) {
        const ox = (this.pos.x < particle.pos.x) ? 1 : -1;
        const oy = (this.pos.y < particle.pos.y) ? 1 : -1;
        const oz = (this.pos.z < particle.pos.z) ? 1 : -1;

        return new Vector(ox, oy, oz);
    }
}
