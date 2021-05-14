export class Particle {
    constructor(x, y, charge, m) {
        this.x = x;
        this.y = y;
        this.fx = 0;
        this.fy = 0;
        this.dx = 0;
        this.dy = 0;
        this.m = m;
        this.charge = charge;

        this.color = { r: 0xFF, g: 0xFF, b: 0xFF };
    }

    speed() {
        return Math.sqrt(this.dx * this.dx + this.dy * this.dy);
    }

    attract(particle) {
        if (!(particle instanceof Particle)) {
            throw new Error('Invalid particle');
        }

        return Math.sign(this.charge) != Math.sign(particle.charge);
    }
}
