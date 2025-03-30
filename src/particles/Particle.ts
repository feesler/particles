import { Vector } from '../engine/Vector/Vector.ts';
import { RGBColor } from './types.ts';

export class Particle {
    pos: Vector;
    force: Vector;
    velocity: Vector;

    m: number;
    charge: number;
    r: number;
    type: number;

    draw: boolean;
    drawPath: boolean;
    path: Vector[];

    color: RGBColor;
    removed: boolean;
    isQuantum: boolean;

    constructor(x: number, y: number, z: number, charge: number, m: number) {
        this.pos = new Vector(x, y, z);
        this.force = new Vector(0, 0, 0);
        this.velocity = new Vector(0, 0, 0);

        this.m = m;
        this.charge = charge;
        this.r = 0;
        this.type = 0;
        this.draw = true;
        this.drawPath = false;
        this.path = [];

        this.color = { r: 0xFF, g: 0xFF, b: 0xFF };
        this.removed = false;
        this.isQuantum = false;
    }

    remove() {
        this.removed = true;
    }

    setMass(mass: number) {
        this.m = mass;
    }

    resetForce() {
        this.force.multiplyByScalar(0);
    }

    attract(particle: Particle) {
        return Math.sign(this.charge) !== Math.sign(particle.charge);
    }

    distanceTo(particle: Particle) {
        const dx = Math.abs(this.pos.x - particle.pos.x);
        const dy = Math.abs(this.pos.y - particle.pos.y);
        const dz = Math.abs(this.pos.z - particle.pos.z);

        return new Vector(dx, dy, dz);
    }

    orientationTo(particle: Particle) {
        const ox = (this.pos.x < particle.pos.x) ? 1 : -1;
        const oy = (this.pos.y < particle.pos.y) ? 1 : -1;
        const oz = (this.pos.z < particle.pos.z) ? 1 : -1;

        return new Vector(ox, oy, oz);
    }

    resetPath() {
        this.path = [];
    }

    setPos(pos: Vector, usePath: boolean = false) {
        if (usePath || this.drawPath) {
            this.path.push(this.pos.copy());
        }
        this.pos.set(pos);
    }
}
