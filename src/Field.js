import { Box } from './Box.js';
import { Particle } from './particles/Particle.js';
import { Star } from './particles/Star.js';
import { DarkParticle } from './particles/DarkParticle.js';
import { Vector } from './Vector.js';

const K = 8.9 * 10;
const G = 6.67 * 0.00001;
const MAX_SPEED = 150;
const DEPTH = 2000;
const MIN_DISTANCE = 0.05;
const BORDER_LOSS = 0.8;

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

        this.drawPaths = false;
        this.useCollide = true;
        this.restoreCollided = true;

        this.rotation = {
            alpha: 0,
            beta: 0,
            gamma: 0,
        };

        this.box = new Box(this.width, this.height, this.depth);
        this.center = new Vector(this.width / 2, this.height / 2, this.depth / 2);

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
        return (
            this.center.y - (this.DIST * (this.center.y - v.y))
            / (this.DIST + v.z + this.Z_SHIFT)
        );
    }

    xF(v) {
        return (
            this.center.x - (this.DIST * (this.center.x - v.x))
            / (this.DIST + v.z + this.Z_SHIFT)
        );
    }

    rotateVector(vector, alpha, beta, gamma) {
        vector.rotateAroundX(alpha);
        vector.rotateAroundY(beta);
        vector.rotateAroundZ(gamma);
    }

    rotate(alpha, beta, gamma) {
        this.box.rotate(alpha, beta, gamma);

        for (const particle of this.particles) {
            this.rotateVector(particle.pos, alpha, beta, gamma);
            this.rotateVector(particle.velocity, alpha, beta, gamma);
            this.rotateVector(particle.force, alpha, beta, gamma);
        }

        this.rotation.alpha += alpha;
        this.rotation.beta += beta;
        this.rotation.gamma += gamma;
    }

    drawParticlePath(frame, particle) {
        const p = new Vector();

        p.set(particle.pos);
        p.add(this.center);

        let x1 = this.xF(p);
        let y1 = this.yF(p);

        while (particle.path.length > 0) {
            const prevPos = particle.path.pop();

            p.set(prevPos);
            p.add(this.center);

            const x0 = this.xF(p);
            const y0 = this.yF(p);
            frame.drawLine(
                x0,
                y0,
                x1,
                y1,
                128,
                128,
                255,
                255,
            );

            x1 = x0;
            y1 = y0;
        }
    }

    drawFrameByPixels() {
        const frame = this.canvas.createFrame();

        this.box.draw(frame, this.center, (v) => this.xF(v), (v) => this.yF(v));

        this.particles.sort((a, b) => b.pos.z - a.pos.z);

        const p = new Vector();

        for (const particle of this.particles) {
            if (particle instanceof DarkParticle) {
                continue;
            }

            p.set(particle.pos);
            p.add(this.center);

            const x = this.xF(p);
            const y = this.yF(p);

            frame.putPixel(
                x,
                y,
                particle.color.r,
                particle.color.g,
                particle.color.b,
                Math.round(255 * (this.depth / p.z)),
            );

            if (this.drawPaths) {
                this.drawParticlePath(frame, particle);
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
        if (!(q instanceof Particle)) {
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

        for (const nq of this.particles) {
            if (nq === particle || nq.removed) {
                continue;
            }

            const d = particle.distanceTo(nq);
            const orientation = particle.orientationTo(nq);
            let distLength = d.getLength() * this.scaleFactor;
            if (!this.useCollide) {
                distLength = Math.max(distLength, this.minDistance);
            }

            d.divideByScalar(distLength);
            d.multiply(orientation);

            const d2 = distLength * distLength;

            if (this.useCollide) {
                const rr = (particle.r + nq.r) / (2 * this.scaleFactor);
                if (!(particle instanceof DarkParticle)
                    && !(nq instanceof DarkParticle)
                ) {
                    if (distLength - rr < MIN_DISTANCE / this.scaleFactor) {
                        this.collide(particle, nq);
                        if (particle.removed) {
                            return;
                        }
                        continue;
                    }
                }
            }

            if (particle.charge && nq.charge) {
                const forceSign = particle.attract(nq) ? 1 : -1;
                const emForce = (K * forceSign * Math.abs(particle.charge * nq.charge)) / d2;
                res.addScaled(d, emForce);
            }

            const gForce = (G * Math.abs(particle.m * nq.m)) / d2;
            res.addScaled(d, gForce);
        }
    }

    collide(particleA, particleB) {
        if (particleA.m + particleB.m >= 100000) {
            const star = new Star(
                particleA.pos.x,
                particleA.pos.y,
                particleA.pos.z,
                particleA.m + particleB.m,
            );

            star.velocity = particleA.velocity.copy();
            star.velocity.add(particleB.velocity);

            const totalVelocity = star.velocity.getLength();
            const relativeVelocity = this.relVelocity(totalVelocity);

            if (relativeVelocity < totalVelocity) {
                star.velocity.divideByScalar(totalVelocity);
                star.velocity.multiplyByScalar(relativeVelocity);
            }
            this.add(star);

            particleA.remove();
            particleB.remove();

            if (this.restoreCollided) {
                this.addNew();
            }
            return;
        }

        particleA.setMass(particleA.m + particleB.m);
        particleA.velocity.add(particleB.velocity);

        const totalVelocity = particleA.velocity.getLength();
        const relativeVelocity = this.relVelocity(totalVelocity);

        if (relativeVelocity < totalVelocity) {
            particleA.velocity.divideByScalar(totalVelocity);
            particleA.velocity.multiplyByScalar(relativeVelocity);
        }

        particleB.remove();

        if (this.restoreCollided) {
            this.addNew();
        }
    }

    addNew() {
        const pos = new Vector(
            Math.random() * this.width - (this.width / 2),
            Math.random() * this.height - (this.height / 2),
            Math.random() * this.depth - (this.depth / 2),
        );

        this.rotateVector(pos, this.rotation.alpha, this.rotation.beta, this.rotation.gamma);

        this.add(new Star(
            pos.x,
            pos.y,
            pos.z,
            Math.random() * 100000,
        ));
    }

    relVelocity(velocity) {
        return this.maxVelocity * Math.tanh(velocity / this.maxVelocity);
    }

    borderCondition(particle) {
        const remVelocity = particle.velocity.copy();
        const currentPos = new Vector();
        const destPos = new Vector();

        if (this.drawPaths) {
            particle.resetPath();
        }

        do {
            currentPos.set(particle.pos);
            destPos.set(currentPos);
            destPos.add(remVelocity);

            const intersection = this.box.getIntersection(currentPos, destPos);
            if (!intersection) {
                currentPos.add(remVelocity);
                if (this.drawPaths) {
                    particle.setPos(currentPos);
                } else {
                    particle.pos.set(currentPos);
                }
                return;
            }

            if (this.drawPaths) {
                particle.setPos(intersection.point);
            } else {
                particle.pos.set(intersection.point);
            }

            remVelocity.set(destPos);
            remVelocity.substract(intersection.point);

            remVelocity.reflect(intersection.normal);
            remVelocity.multiplyByScalar(BORDER_LOSS);

            particle.velocity.reflect(intersection.normal);
            particle.velocity.multiplyByScalar(BORDER_LOSS);

            if (!remVelocity.getLength()) {
                break;
            }
        } while (true);
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

        this.borderCondition(particle);
    }

    async calculate() {
        await Promise.all(this.particles.map((p) => this.force(p)));
        this.particles = this.particles.filter((p) => !p.removed);
        await Promise.all(this.particles.map((p) => this.applyForce(p)));
    }
}
