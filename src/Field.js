import { Box } from './Box.js';
import { Particle } from './particles/Particle.js';
import { Star } from './particles/Star.js';
import { DarkParticle } from './particles/DarkParticle.js';
import { Vector } from './Vector.js';
import { Quantum } from './particles/Quantum.js';
import { Planet } from './particles/Planet.js';
import { rand } from './utils.js';
import { Photon } from './particles/Photon.js';
import { Electron } from './particles/Electron.js';
import { Positron } from './particles/Positron.js';
import { Proton } from './particles/Proton.js';
import { Gluon } from './particles/Gluon.js';
import { ELECTRON_TYPE, GLUON_TYPE, NEUTRON_TYPE, PHOTON_TYPE, POSITRON_TYPE, PROTON_TYPE } from './particles/types.js';

const K = 8.9 * 10;
const G = 6.67 * 0.00001;
const MAX_SPEED = 50;
const DEPTH = 2000;
const MIN_DISTANCE = 0.05;
const BORDER_LOSS = 0.1;

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

        this.drawAllPaths = false;
        this.useCollide = true;
        this.restoreCollided = true;
        this.useSoftening = false;
        this.SOFTENING = 2;
        this.addInstantly = true;
        this.newParticles = [];

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
                particle.color.r,
                particle.color.g,
                particle.color.b,
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

            if (this.drawAllPaths || particle.drawPath) {
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
        this.maxVelocity = (scaleFactor < 1) ? MAX_SPEED : (MAX_SPEED / scaleFactor);
        this.minDistance = MIN_DISTANCE / scaleFactor;
    }

    setTimeStep(timeStep) {
        this.timeStep = timeStep;
    }

    /** Add particle */
    add(particle) {
        if (!(particle instanceof Particle)) {
            return;
        }

        if (this.addInstantly) {
            this.particles.push(particle);
        } else {
            this.newParticles.push(particle);
        }
    }

    push(particle) {
        if (!(particle instanceof Particle)) {
            return;
        }

        this.particles.push(particle);
    }

    force(particle, index) {
        if (particle.removed) {
            return;
        }

        const res = particle.force;

        for (let ind = index + 1, l = this.particles.length; ind < l; ind += 1) {
            const nq = this.particles[ind];
            if (nq.removed) {
                continue;
            }
            const nres = nq.force;

            const d = particle.distanceTo(nq);
            const orientation = particle.orientationTo(nq);

            let distLength = d.getLength() * this.scaleFactor;
            if (!this.useCollide) {
                distLength = Math.max(distLength, this.minDistance);
            }

            d.divideByScalar(distLength);
            d.multiply(orientation);

            const nd = d.copy();
            nd.multiplyByScalar(-1);

            const d2 = distLength * distLength;

            if (this.useCollide) {
                const rr = (particle.r + nq.r) / (2 * this.scaleFactor);
                if (distLength - rr < MIN_DISTANCE / this.scaleFactor) {
                    const collideResult = this.collide(particle, nq);
                    if (particle.removed) {
                        return;
                    }
                    if (collideResult) {
                        continue;
                    }
                }
            }

            if (particle.charge && nq.charge) {
                const forceSign = particle.attract(nq) ? 1 : -1;
                const emForce = (K * forceSign * Math.abs(particle.charge * nq.charge)) / d2;
                res.addScaled(d, emForce);
                nres.addScaled(nd, emForce);
            }

            const r2 = (this.useSoftening)
                ? d2 * Math.sqrt(d2 + this.SOFTENING)
                : d2;

            const gForce = (G * Math.abs(particle.m * nq.m)) / r2;
            res.addScaled(d, gForce);
            nres.addScaled(nd, gForce);
        }
    }

    resolveMassive(A, B) {
        let massiveParticle = (A.m > B.m) ? A : B;
        const lightParticle = (A.m > B.m) ? A : B;
        const newMass = A.m + B.m;
        const particleClass = (newMass >= 100000) ? Star : Planet;

        if (massiveParticle instanceof particleClass) {
            massiveParticle.setMass(newMass);
        } else {
            const newParticle = new particleClass(
                massiveParticle.pos.x,
                massiveParticle.pos.y,
                massiveParticle.pos.z,
                newMass,
            );

            massiveParticle.remove();
            massiveParticle = newParticle;
        }

        const impulseScale = lightParticle.m / newMass;

        massiveParticle.velocity.addScaled(lightParticle.velocity, impulseScale);
        this.fixVelocity(massiveParticle);

        lightParticle.remove();

        if (this.restoreCollided) {
            this.addNew();
        }

        return true;
    }

    getOrthogonalTo(vector) {
        const b0 = ((vector.x < vector.y) && (vector.x < vector.z)) ? 1 : 0;
        const b1 = ((vector.y <= vector.x) && (vector.y < vector.z)) ? 1 : 0;
        const b2 = ((vector.z <= vector.x) && (vector.z <= vector.y)) ? 1 : 0;

        const res = vector.copy();
        res.crossProduct(new Vector(b0, b1, b2));
        return res;
    }

    annihilate(A, B) {
        const dist = A.pos.copy();
        dist.substract(B.pos);

        const lPhoton = new Photon(A.pos.x, A.pos.y, A.pos.z);

        const photonVelocity = this.getOrthogonalTo(dist);
        photonVelocity.normalize();
        photonVelocity.multiplyByScalar(this.maxVelocity);
        lPhoton.velocity.set(photonVelocity);
        this.add(lPhoton);

        const rPhoton = new Photon(A.pos.x, A.pos.y, A.pos.z);
        rPhoton.velocity.set(lPhoton.velocity);
        rPhoton.velocity.multiplyByScalar(-1);
        this.add(rPhoton);

        A.remove();
        B.remove();

        return false;
    }

    resolveQuants(A, B) {
        const isAPhoton = A.type === PHOTON_TYPE;
        const isBPhoton = B.type === PHOTON_TYPE;

        // Photons does not interact
        if (isAPhoton && isBPhoton) {
            return false;
        }

        const isAElectron = A.type === ELECTRON_TYPE;
        const isBElectron = B.type === ELECTRON_TYPE;

        // Photon is absorbed by particle
        if ((isAPhoton && B.charge !== 0) || (isBPhoton && A.charge !== 0)) {
            const photon = (isAPhoton) ? A : B;
            const particle = (isAPhoton) ? B : A;

            particle.velocity.add(photon.velocity);
            this.fixVelocity(particle);

            photon.remove();

            return false;
        }

        // Electron and positron are annihilates
        if (
            (isAElectron || isBElectron)
            && (A.type === POSITRON_TYPE || B.type === POSITRON_TYPE)
        ) {
            return this.annihilate(A, B);
        }

        const dist = A.pos.copy();
        dist.substract(B.pos);

        // Electron emits photon
        if (isAElectron && isBElectron) {
            const photon = new Photon(A.pos.x, A.pos.y, A.pos.z);
            photon.velocity.set(dist);
            this.add(photon);

            return false;
        }

        const isAGluon = A.type === GLUON_TYPE;
        const isBGluon = B.type === GLUON_TYPE;
        const isAHadron = A.type === PROTON_TYPE || A.type === NEUTRON_TYPE;
        const isBHadron = B.type === PROTON_TYPE || B.type === NEUTRON_TYPE;

        const md2 = this.minHardDistance * this.minHardDistance;

        const d2 = dist.getLengthSquare();
        if (d2 < md2) {

            // Gluons interacts with each other and with hardons
            if ((isAGluon || isBGluon) && (isAHadron || isBHadron)) {
                const gluon = (isAGluon) ? A : B;
                const particle = (isAGluon) ? B : A;

                particle.velocity.add(gluon.velocity);

                gluon.remove();
                return true;
            }

            if (isAHadron && isBHadron) {
                const gluon = new Gluon(A.pos.x, A.pos.y, A.pos.z);
                gluon.velocity.set(dist);
                this.add(gluon);
                return true;
            }
        }

        return false;
    }

    collide(A, B) {
        if (A instanceof DarkParticle || B instanceof DarkParticle) {
            return false;
        }

        if (!(A instanceof Quantum) && !(B instanceof Quantum)) {
            return this.resolveMassive(A, B);
        }

        if (A instanceof Quantum && B instanceof Quantum) {
            return this.resolveQuants(A, B);
        }
    }

    spontaneous() {
        const chance = rand();
        if (chance < 0.2) {
            return;
        }

        const pos = new Vector(
            rand(-this.center.x, this.center.x),
            rand(-this.center.y, this.center.y),
            rand(-this.center.z, this.center.z),
        );

        this.rotateVector(pos, this.rotation.alpha, this.rotation.beta, this.rotation.gamma);

        const negParticle = new Electron(pos.x, pos.y, pos.z);
        negParticle.velocity.x = rand(0, this.maxVelocity);
        negParticle.velocity.y = rand(0, this.maxVelocity);
        negParticle.velocity.z = rand(0, this.maxVelocity);
        this.fixVelocity(negParticle);
        this.add(negParticle);

        const posParticle = new Positron(pos.x, pos.y, pos.z);
        posParticle.velocity.set(negParticle.velocity);
        posParticle.velocity.multiplyByScalar(-1);
        this.add(posParticle);
    }

    addNew() {
        const pos = new Vector(
            rand(-this.center.x, this.center.x),
            rand(-this.center.y, this.center.y),
            rand(-this.center.z, this.center.z),
        );

        this.rotateVector(pos, this.rotation.alpha, this.rotation.beta, this.rotation.gamma);

        this.add(new Star(
            pos.x,
            pos.y,
            pos.z,
            rand(100000, 1000000),
        ));
    }

    relVelocity(velocity) {
        return this.maxVelocity * Math.tanh(velocity / this.maxVelocity);
    }

    borderCondition(particle) {
        const remVelocity = particle.velocity.copy();
        const currentPos = new Vector();
        const destPos = new Vector();

        if (this.drawAllPaths || particle.drawPath) {
            particle.resetPath();
        }

        do {
            currentPos.set(particle.pos);
            destPos.set(currentPos);
            destPos.add(remVelocity);

            const intersection = this.box.getIntersection(currentPos, destPos);
            if (!intersection) {
                currentPos.add(remVelocity);
                particle.setPos(currentPos, this.drawAllPaths);
                return;
            }

            particle.setPos(intersection.point, this.drawAllPaths);

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

    applyForce(particle) {
        const { velocity, force } = particle;

        if (particle.m === 0) {
            velocity.add(force);
            velocity.normalize();
            velocity.multiplyByScalar(this.maxVelocity);
        } else {
            const scalar = this.timeStep / particle.m;
            velocity.addScaled(force, scalar);
            this.fixVelocity(particle);
        }

        this.borderCondition(particle);
    }

    fixVelocity(particle) {
        const totalVelocity = particle.velocity.getLength();
        const relativeVelocity = this.relVelocity(totalVelocity);
        if (relativeVelocity < totalVelocity) {
            const vScalar = relativeVelocity / totalVelocity;
            particle.velocity.multiplyByScalar(vScalar);
        }
    }

    calculate() {
        if (!this.addInstantly) {
            this.newParticles = [];
        }

        this.particles.forEach((p) => p.resetForce());
        this.particles.forEach((p, ind) => this.force(p, ind));
        this.particles = this.particles.filter((p) => !p.removed);

        if (!this.addInstantly) {
            this.particles.push(...this.newParticles);
        }

        this.spontaneous();

        this.particles.forEach((p) => this.applyForce(p));
    }
}
