import { Particle } from './Particle.js';
import { Vector } from './Vector.js';

const K = 8.9 * 10;
const G = 6.67 * 0.00001;
const MAX_SPEED = 200;

export class Field {
    constructor(canvasElem, scaleFactor, timeStep) {
        if (!canvasElem) {
            throw new Error('Invalid canvas');
        }

        this.canvas = canvasElem;
        this.context2d = this.canvas.getContext('2d');
        this.height = parseInt(this.canvas.getAttribute('height'));
        this.width = parseInt(this.canvas.getAttribute('width'));

        this.particles = [];
        this.setScaleFactor(scaleFactor);
        this.timeStep = timeStep;
    }

    drawFrameByCircles() {
        this.context2d.clearRect(0, 0, this.width, this.height);
        this.context2d.fillStyle = 'white';
        this.context2d.strokeStyle = 'white';
        this.context2d.lineWidth = 0.5;

        for (const particle of this.particles) {
            this.context2d.beginPath();
            this.context2d.arc(particle.pos.x, particle.pos.y, 0.5, 0, Math.PI * 2, true);
            this.context2d.stroke();
        }
    }

    putPixel(frame, x, y, r, g, b, a) {
        const rx = Math.round(x);
        const ry = Math.round(y);
        let ind = ry * (this.width * 4) + rx * 4;

        frame.data[ind] = r;
        frame.data[ind + 1] = g;
        frame.data[ind + 2] = b;
        frame.data[ind + 3] = a;
    }

    drawFrameByPixels() {
        const frame = this.context2d.createImageData(this.width, this.height);

        for (const particle of this.particles) {
            this.putPixel(frame,
                particle.pos.x,
                particle.pos.y,
                particle.color.r,
                particle.color.g,
                particle.color.b,
                255,
            );
        }

        this.context2d.putImageData(frame, 0, 0);
    }

    drawFrame() {
        this.drawFrameByPixels();
    }

    setScaleFactor(scaleFactor) {
        this.scaleFactor = scaleFactor;
        this.maxVelocity = MAX_SPEED / scaleFactor;
    }

    /* Add particle */
    add(q) {
        if (!q instanceof Particle) {
            return;
        }

        this.particles.push(q);
    }

    async force(particle) {
        const MIN_DISTANCE = 0.0001;
        const res = new Vector(0, 0);

        for (let nq of this.particles) {
            if (nq == particle) {
                continue;
            }

            const dist = particle.distanceTo(nq);
            const orientation = particle.orientationTo(nq);

            let dx = dist.x * this.scaleFactor;
            let dy = dist.y * this.scaleFactor;

            let d2 = dx * dx + dy * dy;
            let d = Math.max(Math.sqrt(d2), MIN_DISTANCE);

            const cosa = (dx / d) * orientation.x;
            const cosb = (dy / d) * orientation.y;
            if (isNaN(cosa) || isNaN(cosb)) {
                throw new Error('Invalid value');
            }

            let forceSign = 1;

            if (!particle.attract(nq)) {
                forceSign = -1;
            }

            let emForce = 0;
            emForce = K * forceSign * Math.abs(particle.charge * nq.charge) / d2;
            res.x += (emForce * cosa);
            res.y += (emForce * cosb);

            let gForce = 0;
            gForce = G * Math.abs(particle.m * nq.m) / d2;
            res.x += (gForce * cosa);
            res.y += (gForce * cosb);
        }

        return res;
    }

    relVelocity(velocity) {
        return this.maxVelocity * Math.tanh(velocity / this.maxVelocity);
    }

    async applyForce(particle, force) {
        const q = particle;
        const f = force;
        const dt = this.timeStep;

        let ax = f.x / q.m;
        let ay = f.y / q.m;
        if (Number.isNaN(ax) || Number.isNaN(ay)) {
            throw new Errro('Invalid values');
        }

        let dx = this.relVelocity(q.velocity.x + ax * dt);
        let dy = this.relVelocity(q.velocity.y + ay * dt);
        if (Number.isNaN(dx) || Number.isNaN(dy)) {
            throw new Errro('Invalid values');
        }

        let newx = q.pos.x + dx;
        const loss = 0.1;

        if (newx < 0) {
            newx = -(q.pos.x + dx);
            dx = -dx * loss;
        } else if (newx > this.width) {
            newx = this.width - (newx - this.width);
            dx = -dx * loss;
        }

        let newy = q.pos.y + dy;
        if (newy < 0) {
            newy = -(q.pos.y + dy);
            dy = -dy * loss;
        } else if (newy > this.height) {
            newy = this.height - (newy - this.height);
            dy = -dy * loss;
        }

        q.pos.x = newx;
        q.pos.y = newy;

        q.velocity.x = dx;
        q.velocity.y = dy;

        q.force.x += f.x;
        q.force.y += f.y;
    }

    async applyForces(forces) {
        const tasks = this.particles.map((particle, ind) =>
            this.applyForce(particle, forces[ind])
        );

        await Promise.all(tasks);
    }

    async calculate() {
        const tasks = this.particles.map(q => this.force(q));

        const forces = await Promise.all(tasks);

        await this.applyForces(forces);
    }
}
