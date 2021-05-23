import { Box } from './Box.js';
import { Particle } from './particles/Particle.js';
import { Vector } from './Vector.js';

const K = 8.9 * 10;
const G = 6.67 * 0.00001;
const MAX_SPEED = 200;
const DEPTH = 500;

const ALPHA = -Math.PI / 8; /* Rotation angle aound x-axis */
const BETA = Math.PI / 8; /* Rotation angle aound y-axis */

export class Field {
    constructor(canvas, scaleFactor, timeStep) {
        if (!canvas) {
            throw new Error('Invalid canvas');
        }

        this.canvas = canvas;

        this.depth = DEPTH;
        this.xShift = 0;
        this.yShift = 0;

        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.HW = this.width / 2;
        this.HH = this.height / 2;
        this.HD = this.depth / 2;
        this.DIST = 100;
        this.Z_SHIFT = 0;

        this.box = new Box(this.width, this.height, this.depth);
        this.center = new Vector(this.HW, this.HH, this.HD);

        this.particles = [];
        this.setScaleFactor(scaleFactor);
        this.setTimeStep(timeStep);
    }

    drawFrameByCircles() {
        this.canvas.context2d.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.canvas.context2d.fillStyle = 'white';
        this.canvas.context2d.strokeStyle = 'white';
        this.canvas.context2d.lineWidth = 1;

        for (const particle of this.particles) {
            this.canvas.context2d.fillStyle = `rgb(${particle.color.r}, ${particle.color.g}, ${particle.color.b})`;
            this.canvas.context2d.strokeStyle = `rgb(${particle.color.r}, ${particle.color.g}, ${particle.color.b})`;

            this.canvas.context2d.beginPath();
            this.canvas.context2d.arc(
                this.xF(particle.pos),
                this.yF(particle.pos),
                0.5,
                0,
                Math.PI * 2,
                true,
            );
            this.canvas.context2d.stroke();
        }
    }

    yF(v) {
        return this.HH - this.DIST * (this.HH - v.y) / (this.DIST + v.z + this.Z_SHIFT);
    }

    xF(v) {
        return this.HW - this.DIST * (this.HW - v.x) / (this.DIST + v.z + this.Z_SHIFT);
    }

    rotateVector(vector, alpha, beta, gamma, center) {
        vector.substract(center);

        vector.rotateAroundX(alpha);
        vector.rotateAroundY(beta);
        vector.rotateAroundZ(gamma);

        vector.add(center);
    }

    rotate(alpha, beta, gamma) {
        this.box.rotate(alpha, beta, gamma);

        for (const particle of this.particles) {
            this.rotateVector(particle.pos, alpha, beta, gamma, this.center);
            this.rotateVector(particle.velocity, alpha, beta, gamma, this.center);
            this.rotateVector(particle.force, alpha, beta, gamma, this.center);
        }
    };

    drawFrameByPixels() {
        const frame = this.canvas.createFrame();

        this.box.draw(frame, this.center, (v) => this.xF(v), (v) => this.yF(v));

        this.particles.sort((a, b) => b.pos.z - a.pos.z);

        for (const particle of this.particles) {
            frame.putPixel(
                this.xF(particle.pos),
                this.yF(particle.pos),
                particle.color.r,
                particle.color.g,
                particle.color.b,
                Math.round(255 * (this.depth / particle.pos.z)),
            );
        }

        this.canvas.drawFrame(frame);
    }

    drawFrame() {
        this.drawFrameByPixels();
    }

    setScaleFactor(scaleFactor) {
        this.scaleFactor = scaleFactor;
        this.maxVelocity = MAX_SPEED / scaleFactor;
    }

    setTimeStep(timeStep) {
        this.timeStep = timeStep;
    }

    /* Add particle */
    add(q) {
        if (!q instanceof Particle) {
            return;
        }

        this.particles.push(q);
    }

    async force(particle) {
        const MIN_DISTANCE = 0.001;

        if (particle.removed) {
            return;
        }

        const res = particle.force;
        res.x = 0;
        res.y = 0;
        res.z = 0;

        for (let nq of this.particles) {
            if (nq == particle || nq.removed) {
                continue;
            }

            const dist = particle.distanceTo(nq);
            const orientation = particle.orientationTo(nq);

            let dx = dist.x * this.scaleFactor;
            let dy = dist.y * this.scaleFactor;
            let dz = dist.z * this.scaleFactor;

            let d2 = dx * dx + dy * dy + dz * dz;
            let d = Math.sqrt(d2);
            if (d < MIN_DISTANCE / this.scaleFactor) {
                this.collide(particle, nq);
                continue;
            }

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
    }

    collide(particleA, particleB) {
        particleA.m += particleB.m;

        particleA.velocity.x = this.relVelocity(particleA.velocity.x + particleB.velocity.x);
        particleA.velocity.y = this.relVelocity(particleA.velocity.y + particleB.velocity.y);
        particleA.velocity.z = this.relVelocity(particleA.velocity.z + particleB.velocity.z);

        particleB.removed = true;
    }

    relVelocity(velocity) {
        return this.maxVelocity * Math.tanh(velocity / this.maxVelocity);
    }

    borderCondition(pos, delta, maxRange) {
        const loss = 0.1;
        const result = { pos, delta };

        result.pos += delta;
        if (result.pos < 0 || result.pos > maxRange) {
            result.pos *= -1;
            if (result.pos < 0) {
                result.pos += maxRange * 2;
            }
            result.delta *= -loss;
        }

        return result;
    }

    async applyForce(particle) {
        const q = particle;
        const f = particle.force;
        const dt = this.timeStep;

        const ax = f.x / q.m;
        const ay = f.y / q.m;
        const az = f.z / q.m;
        if (Number.isNaN(ax) || Number.isNaN(ay) || Number.isNaN(az)) {
            throw new Errro('Invalid values');
        }

        const dx = this.relVelocity(q.velocity.x + ax * dt);
        const dy = this.relVelocity(q.velocity.y + ay * dt);
        const dz = this.relVelocity(q.velocity.z + az * dt);
        if (Number.isNaN(dx) || Number.isNaN(dy) || Number.isNaN(dz)) {
            throw new Error('Invalid values');
        }

        const newX = this.borderCondition(q.pos.x, dx, this.width);
        const newY = this.borderCondition(q.pos.y, dy, this.height);
        const newZ = this.borderCondition(q.pos.z, dz, this.depth);

        q.pos.x = newX.pos;
        q.pos.y = newY.pos;
        q.pos.z = newZ.pos;

        q.velocity.x = newX.delta;
        q.velocity.y = newY.delta;
        q.velocity.z = newZ.delta;
    }

    async calculate() {
        await Promise.all(this.particles.map((p) => this.force(p)));
        this.particles = this.particles.filter((p) => !p.removed);
        await Promise.all(this.particles.map((p) => this.applyForce(p)));
    }
}
