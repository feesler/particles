import { Particle } from './Particle.js';
import { Vector } from './Vector.js';

const K = 8.9 * 10;
const G = 6.67 * 0.00001;
const MAX_SPEED = 200;
const DEPTH = 500;

const ALPHA = -Math.PI / 8;
const BETA = Math.PI / 8;

export class Field {
    constructor(canvasElem, scaleFactor, timeStep) {
        if (!canvasElem) {
            throw new Error('Invalid canvas');
        }

        this.canvas = canvasElem;
        this.context2d = this.canvas.getContext('2d');
        this.frameWidth = parseInt(this.canvas.getAttribute('width'));
        this.frameHeight = parseInt(this.canvas.getAttribute('height'));

        this.depth = DEPTH;

        this.xShift = 0;
        this.yShift = 0;

        const spaceTest = new Vector(0, 0, this.depth);
        const x = this.xF(spaceTest);
        const y = this.yF(spaceTest);
        this.yShift = Math.ceil(Math.abs(y));

        this.width = this.frameWidth - Math.ceil(Math.abs(x));
        this.height = this.frameHeight - this.yShift;

        this.particles = [];
        this.setScaleFactor(scaleFactor);
        this.timeStep = timeStep;
    }

    drawFrameByCircles() {
        this.context2d.clearRect(0, 0, this.frameWidth, this.frameHeight);
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
        let ind = ry * (this.frameWidth * 4) + rx * 4;

        frame.data[ind] = r;
        frame.data[ind + 1] = g;
        frame.data[ind + 2] = b;
        frame.data[ind + 3] = a;
    }

    xF(v) {
        return this.xShift + v.x * Math.cos(BETA) + v.z * Math.sin(BETA);
    }

    yF(v) {
        return this.yShift + v.y * Math.cos(ALPHA) + v.z * Math.sin(ALPHA);
    }

    drawFrameByPixels() {
        const frame = this.context2d.createImageData(this.frameWidth, this.frameHeight);

        this.particles.sort((a, b) => b.pos.z - a.pos.z);

        for (const particle of this.particles) {
            this.putPixel(frame,
                this.xF(particle.pos),
                this.yF(particle.pos),
                particle.color.r,
                particle.color.g,
                particle.color.b,
                Math.round(255 * (this.depth / particle.pos.z)),
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
        const MIN_DISTANCE = 0.00001;
        const res = new Vector(0, 0, 0);

        for (let nq of this.particles) {
            if (nq == particle) {
                continue;
            }

            const dist = particle.distanceTo(nq);
            const orientation = particle.orientationTo(nq);

            let dx = dist.x * this.scaleFactor;
            let dy = dist.y * this.scaleFactor;
            let dz = dist.z * this.scaleFactor;

            let d2 = dx * dx + dy * dy + dz * dz;
            let d = Math.max(Math.sqrt(d2), MIN_DISTANCE);

            const cosA = (dx / d) * orientation.x;
            const cosB = (dy / d) * orientation.y;
            const cosC = (dz / d) * orientation.z;
            if (isNaN(cosA) || isNaN(cosB) || isNaN(cosC)) {
                throw new Error('Invalid value');
            }

            let forceSign = 1;

            if (!particle.attract(nq)) {
                forceSign = -1;
            }

            let emForce = 0;
            emForce = K * forceSign * Math.abs(particle.charge * nq.charge) / d2;
            res.x += (emForce * cosA);
            res.y += (emForce * cosB);
            res.z += (emForce * cosC);

            let gForce = 0;
            gForce = G * Math.abs(particle.m * nq.m) / d2;
            res.x += (gForce * cosA);
            res.y += (gForce * cosB);
            res.z += (gForce * cosC);
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
        let az = f.z / q.m;
        if (Number.isNaN(ax) || Number.isNaN(ay) || Number.isNaN(az)) {
            throw new Errro('Invalid values');
        }

        let dx = this.relVelocity(q.velocity.x + ax * dt);
        let dy = this.relVelocity(q.velocity.y + ay * dt);
        let dz = this.relVelocity(q.velocity.z + az * dt);
        if (Number.isNaN(dx) || Number.isNaN(dy) || Number.isNaN(dz)) {
            throw new Error('Invalid values');
        }

        const loss = 0.1;

        let newX = q.pos.x + dx;
        if (newX < 0) {
            newX = -(q.pos.x + dx);
            dx = -dx * loss;
        } else if (newX > this.width) {
            newX = this.width - (newX - this.width);
            dx = -dx * loss;
        }

        let newY = q.pos.y + dy;
        if (newY < 0) {
            newY = -(q.pos.y + dy);
            dy = -dy * loss;
        } else if (newY > this.height) {
            newY = this.height - (newY - this.height);
            dy = -dy * loss;
        }

        let newZ = q.pos.z + dz;
        if (newZ < 0) {
            newZ = -(q.pos.z + dz);
            dz = -dz * loss;
        } else if (newZ > this.depth) {
            newZ = this.depth - (newZ - this.depth);
            dz = -dz * loss;
        }

        q.pos.x = newX;
        q.pos.y = newY;
        q.pos.z = newZ;

        q.velocity.x = dx;
        q.velocity.y = dy;
        q.velocity.z = dz;

        q.force.x += f.x;
        q.force.y += f.y;
        q.force.z += f.z;
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
