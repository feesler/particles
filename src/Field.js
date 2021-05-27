import { Box } from './Box.js';
import { Particle } from './particles/Particle.js';
import { Vector } from './Vector.js';

const K = 8.9 * 10;
const G = 6.67 * 0.00001;
const MAX_SPEED = 200;
const DEPTH = 500;
const MIN_DISTANCE = 0.0001;

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
        this.DIST = 1000;
        this.Z_SHIFT = 0;

        this.box = new Box(this.width, this.height, this.depth);
        this.center = new Vector(this.width / 2, this.height / 2, this.depth / 2);
        // Prepare normales to each side of box
        this.boxDx = new Vector(0, this.center.y, this.center.z);
        this.boxDx.substract(this.center);
        this.boxDx.normalize();

        this.boxDy = new Vector(this.center.x, 0, this.center.z);
        this.boxDy.substract(this.center);
        this.boxDy.normalize();

        this.boxDz = new Vector(this.center.x, this.center.y, 0);
        this.boxDz.substract(this.center);
        this.boxDz.normalize();

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
        return this.center.y - this.DIST * (this.center.y - v.y) / (this.DIST + v.z + this.Z_SHIFT);
    }

    xF(v) {
        return this.center.x - this.DIST * (this.center.x - v.x) / (this.DIST + v.z + this.Z_SHIFT);
    }

    rotateVector(vector, alpha, beta, gamma, center) {
        if (center) {
            vector.substract(center);
        }

        vector.rotateAroundX(alpha);
        vector.rotateAroundY(beta);
        vector.rotateAroundZ(gamma);

        if (center) {
            vector.add(center);
        }
    }

    rotate(alpha, beta, gamma) {
        this.box.rotate(alpha, beta, gamma);

        this.rotateVector(this.boxDx, alpha, beta, gamma);
        this.rotateVector(this.boxDy, alpha, beta, gamma);
        this.rotateVector(this.boxDz, alpha, beta, gamma);

        for (const particle of this.particles) {
            this.rotateVector(particle.pos, alpha, beta, gamma, this.center);
            this.rotateVector(particle.velocity, alpha, beta, gamma);
            this.rotateVector(particle.force, alpha, beta, gamma);
        }
    };

    drawFrameByPixels() {
        const frame = this.canvas.createFrame();

        this.box.draw(frame, this.center, (v) => this.xF(v), (v) => this.yF(v));

        this.particles.sort((a, b) => b.pos.z - a.pos.z);

        for (const particle of this.particles) {
            const x = this.xF(particle.pos);
            const y = this.yF(particle.pos);

            frame.putPixel(
                x,
                y,
                particle.color.r,
                particle.color.g,
                particle.color.b,
                Math.round(255 * (this.depth / particle.pos.z)),
            );

            if (particle.prevPos) {
                const x0 = this.xF(particle.prevPos);
                const y0 = this.yF(particle.prevPos);
                frame.drawLine(
                    x,
                    y,
                    x0,
                    y0,
                    128,
                    128,
                    255,
                    255,
                );
            }
        }

        this.canvas.drawFrame(frame);
    }

    drawFrame() {
        this.drawFrameByPixels();
    }

    setScaleFactor(scaleFactor) {
        this.scaleFactor = scaleFactor;
        this.maxVelocity = MAX_SPEED / scaleFactor;
        this.minDistance = MIN_DISTANCE / scaleFactor;
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

            const d = particle.distanceTo(nq);
            const orientation = particle.orientationTo(nq);
            let distLength = d.getLength() * this.scaleFactor;
            distLength = Math.max(distLength, this.minDistance);

            d.divideByScalar(distLength);
            d.multiply(orientation);

            const d2 = distLength * distLength;
            /*
            if (distLength < this.minDistance) {
                this.collide(particle, nq);
                continue;
            }
            */

            if (particle.charge && nq.charge) {
                const forceSign = particle.attract(nq) ? 1 : -1;
                const emForce = K * forceSign * Math.abs(particle.charge * nq.charge) / d2;
                res.addScaled(d, emForce);
            }

            const gForce = G * Math.abs(particle.m * nq.m) / d2;
            res.addScaled(d, gForce);
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

    intersectPlane(planePoint, planeNormal, linePoint, lineVector) {
        const lineNormalized = lineVector.copy();
        const planeDot = planeNormal.dotProduct(lineNormalized);
        if (planeDot == 0) {
            return null;
        }

        const t = (planeNormal.dotProduct(planePoint) - planeNormal.dotProduct(linePoint)) / planeDot;
        const res = linePoint.copy();
        res.addScaled(lineNormalized, t);
        return res;
    }

    borderCondition(particle) {
        const LOSS = 0.8;
        const { velocity } = particle;
        const d = particle.pos.copy();
        d.add(velocity);
        d.substract(this.center);

        const dpx = d.dotProduct(this.boxDx);
        const dpy = d.dotProduct(this.boxDy);
        const dpz = d.dotProduct(this.boxDz);

        const xOut = Math.abs(dpx) > this.center.x;
        const yOut = Math.abs(dpy) > this.center.y;
        const zOut = Math.abs(dpz) > this.center.z;

        if (!xOut && !yOut && !zOut) {
            particle.pos.add(velocity);
            return;
        }

        let intersection;
        if (xOut) {
            intersection = this.intersectPlane(this.box.vertices[0], this.boxDx, particle.pos, d);
            if (!intersection) {
                intersection = this.intersectPlane(this.box.vertices[1], this.boxDx, particle.pos, d);
            }
            if (!intersection) {
                throw new Error('Not intersection found');
            }
            particle.pos.set(intersection);

            const remVelocity = d.copy();
            remVelocity.substract(intersection);

            let dp = 2 * remVelocity.dotProduct(this.boxDx);
            remVelocity.substractScaled(this.boxDx, dp);
            remVelocity.add(this.center);
            particle.pos.add(remVelocity);

            dp = 2 * velocity.dotProduct(this.boxDx) * LOSS;
            velocity.substractScaled(this.boxDx, dp);
        }

        if (yOut) {
            intersection = this.intersectPlane(this.box.vertices[0], this.boxDx, particle.pos, d);
            if (!intersection) {
                intersection = this.intersectPlane(this.box.vertices[4], this.boxDx, particle.pos, d);
            }
            if (!intersection) {
                throw new Error('Not intersection found');
            }
            particle.pos.set(intersection);

            const remVelocity = d.copy();
            remVelocity.substract(intersection);

            let dp = 2 * remVelocity.dotProduct(this.boxDy);
            remVelocity.substractScaled(this.boxDy, dp);
            remVelocity.add(this.center);
            particle.pos.add(remVelocity);

            dp = 2 * velocity.dotProduct(this.boxDy) * LOSS;
            velocity.substractScaled(this.boxDy, dp);
        }

        if (zOut) {
            intersection = this.intersectPlane(this.box.vertices[0], this.boxDx, particle.pos, d);
            if (!intersection) {
                intersection = this.intersectPlane(this.box.vertices[3], this.boxDx, particle.pos, d);
            }
            if (!intersection) {
                throw new Error('Not intersection found');
            }
            particle.pos.set(intersection);

            const remVelocity = d.copy();
            remVelocity.substract(intersection);

            let dp = 2 * remVelocity.dotProduct(this.boxDz);
            remVelocity.substractScaled(this.boxDz, dp);
            remVelocity.add(this.center);
            particle.pos.add(remVelocity);

            dp = 2 * velocity.dotProduct(this.boxDz) * LOSS;
            velocity.substractScaled(this.boxDz, dp);
        }

        //particle.pos.add(velocity);
    }

    async applyForce(particle) {
        const { velocity, force } = particle;

        const scalar = this.timeStep / particle.m;
        velocity.addScaled(force, scalar);

        const totalVelocity = velocity.getLength();
        const relativeVelocity = this.relVelocity(totalVelocity);
        if (relativeVelocity < totalVelocity) {
            const vScalar = relativeVelocity / totalVelocity;
            velocity.multiplyByScalar(vScalar);
        }

        if (!particle.prevPos) {
            particle.prevPos = particle.pos.copy();
        } else {
            particle.prevPos.set(particle.pos);
        }

        this.borderCondition(particle);
    }

    async calculate() {
        await Promise.all(this.particles.map((p) => this.force(p)));
        this.particles = this.particles.filter((p) => !p.removed);
        await Promise.all(this.particles.map((p) => this.applyForce(p)));
    }
}
