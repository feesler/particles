import { Box } from './Box.js';
import { Particle } from './particles/Particle.js';
import { Star } from './particles/Star.js';
import { Vector } from './Vector.js';
import { Quantum } from './particles/Quantum.js';
import { Planet } from './particles/Planet.js';
import { AXES, rand } from './utils.js';
import { Photon } from './particles/Photon.js';
import { Electron } from './particles/Electron.js';
import { Positron } from './particles/Positron.js';
import { Gluon } from './particles/Gluon.js';
import {
    DARK_TYPE,
    ELECTRON_TYPE,
    GLUON_TYPE,
    NEUTRON_TYPE,
    PHOTON_TYPE,
    PLANET_TYPE,
    POSITRON_TYPE,
    PROTON_TYPE,
    STAR_TYPE,
} from './particles/types.js';
import { OctTree } from './OctTree.js';

const K = 8.9 * 10;
const G = 6.67 * 0.0000001;
const MAX_SPEED = 150;
const DEPTH = 2000;
const MIN_DISTANCE = 0.05;
const MIN_HARD_DIST = 0.005;
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
        this.useSpontaneous = false;

        this.useBarnesHut = true;
        this.drawNodes = false;
        if (this.useBarnesHut) {
            this.sceneNormals = {
                x: new Vector(1, 0, 0),
                y: new Vector(0, 1, 0),
                z: new Vector(0, 0, 1),
            };

            this.tree = null;
            this.boundingOffset = 0;
            this.boundingSize = 0;
            this.theta = 0.5;
            this.dist = new Vector();
        }

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

        if (this.useBarnesHut) {
            this.calculateBoundingSize();
        }
    }

    drawFrameByCircles() {
        this.canvas.clear();

        const p = new Vector();

        for (const particle of this.particles) {
            if (!particle.draw) {
                continue;
            }

            p.set(particle.pos);
            p.add(this.center);

            const p0 = this.project(p);

            this.canvas.drawCircle(p0.x, p0.y, 0.5, particle.color);
        }

        if (this.canvas.drawScene) {
            this.canvas.drawScene();
        }
    }

    project(vector) {
        const zDist = this.DIST + vector.z + this.Z_SHIFT;

        return {
            x: (
                this.center.x - (this.DIST * (this.center.x - vector.x))
                / zDist
            ),
            y: (
                this.center.y - (this.DIST * (this.center.y - vector.y))
                / zDist
            ),
            z: vector.z,
        };
    }

    calculateBoundingSize() {
        const BOUNDING_GAP = 10;
        let min = 0;
        let max = 0;

        for (const axis of AXES) {
            const values = this.box.vertices.map(
                (vert) => vert.dotProduct(this.sceneNormals[axis]),
            );
            min = Math.min(min, ...values);
            max = Math.max(max, ...values);
        }
        this.boundingOffset = min - BOUNDING_GAP;
        this.boundingSize = max - min + BOUNDING_GAP * 2;
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

        if (this.useBarnesHut) {
            this.calculateBoundingSize();
        }
    }

    drawParticlePath(frame, particle) {
        const p = new Vector();

        p.set(particle.pos);
        p.add(this.center);

        let p1 = this.project(p);

        while (particle.path.length > 0) {
            const prevPos = particle.path.pop();

            p.set(prevPos);
            p.add(this.center);

            const p0 = this.project(p);
            frame.drawLine(
                p0.x,
                p0.y,
                p1.x,
                p1.y,
                particle.color.r,
                particle.color.g,
                particle.color.b,
                255,
            );

            p1 = p0;
        }
    }

    drawNode(frame, node) {
        if (!node) {
            return;
        }

        const nodeBox = new Box(node.size, node.size, node.size);

        const boxCenter = node.offset.copy();
        boxCenter.addScalar(node.half);

        nodeBox.draw(frame, boxCenter, (v) => this.project(v));
        for (const child of node.nodes) {
            if (child && child.nodes) {
                this.drawNode(frame, child);
            }
        }
    }

    drawFrameByPixels() {
        const frame = this.canvas.createFrame();

        this.box.draw(frame, this.center, (v) => this.project(v));

        this.particles.sort((a, b) => b.pos.z - a.pos.z);

        const p = new Vector();

        for (const particle of this.particles) {
            if (!particle.draw) {
                continue;
            }

            p.set(particle.pos);
            p.add(this.center);

            const p0 = this.project(p);

            frame.putPixel(
                p0.x,
                p0.y,
                particle.color.r,
                particle.color.g,
                particle.color.b,
                Math.round(255 * (this.depth / p.z)),
            );

            if (this.drawAllPaths || particle.drawPath) {
                this.drawParticlePath(frame, particle);
            }
        }

        if (this.useBarnesHut && this.tree && this.drawNodes) {
            this.drawNode(frame, this.tree);
        }

        this.canvas.drawFrame(frame);
    }

    drawFrame() {
        this.drawFrameByCircles();
    }

    setScaleFactor(scaleFactor) {
        this.scaleFactor = scaleFactor;
        this.maxVelocity = (scaleFactor < 1) ? MAX_SPEED : (MAX_SPEED / scaleFactor);
        this.minDistance = MIN_DISTANCE / scaleFactor;
        this.minHardDistance = MIN_HARD_DIST / this.scaleFactor;
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
            if (this.useBarnesHut && this.tree) {
                this.tree.insert(particle);
            }
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
        const d = new Vector();
        const nd = new Vector();

        for (let ind = index + 1, l = this.particles.length; ind < l; ind += 1) {
            const nq = this.particles[ind];
            if (nq.removed) {
                continue;
            }
            const nres = nq.force;

            d.set(nq.pos);
            d.substract(particle.pos);

            let distLength = d.getLength() * this.scaleFactor;
            if (!this.useCollide) {
                distLength = Math.max(distLength, this.minDistance);
            }

            d.divideByScalar(distLength);

            nd.set(d);
            nd.multiplyByScalar(-1);

            const d2 = distLength * distLength;

            if (this.useCollide) {
                const rr = (particle.r + nq.r) / (2 * this.scaleFactor);
                if (distLength - rr < this.minDistance) {
                    const collideResult = this.collide(particle, nq);
                    if (particle.removed) {
                        return;
                    }
                    if (nq.removed) {
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
        if (!A || A.removed || !B || B.removed) {
            return false;
        }

        let massiveParticle = (A.m > B.m) ? A : B;
        const lightParticle = (A.m > B.m) ? B : A;
        const newMass = A.m + B.m;
        const particleType = (newMass >= 100000) ? STAR_TYPE : PLANET_TYPE;

        if (massiveParticle.type === particleType) {
            massiveParticle.setMass(newMass);
        } else {
            const ParticleClass = (newMass >= 100000) ? Star : Planet;
            const newParticle = new ParticleClass(
                massiveParticle.pos.x,
                massiveParticle.pos.y,
                massiveParticle.pos.z,
                newMass,
            );

            massiveParticle.remove();
            this.add(newParticle);
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

    annihilate(A, B) {
        const dist = A.pos.copy();
        dist.substract(B.pos);

        const lPhoton = new Photon(A.pos.x, A.pos.y, A.pos.z);

        const photonVelocity = dist.getOrthogonal();
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
        if ((isAElectron && B.charge !== 0) || (isBElectron && A.charge !== 0)) {
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
        if (!A || !A.type || !B || !B.type || A === B) {
            return true;
        }

        if (A.type === DARK_TYPE || B.type === DARK_TYPE) {
            return false;
        }

        if (!A.isQuantum && !B.isQuantum) {
            return this.resolveMassive(A, B);
        }

        if (A.isQuantum && B.isQuantum) {
            return this.resolveQuants(A, B);
        }

        return false;
    }

    spontaneous() {
        const chance = rand();
        if (chance < 0.1) {
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
            rand(100000, 10000000),
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

            if (particle.type === PHOTON_TYPE) {
                particle.reflect();
            }

            if (!remVelocity.getLength()) {
                break;
            }
        } while (true);
    }

    applyForce(particle, dt) {
        const { velocity, force } = particle;

        if (!dt) {
            return;
        }

        if (particle.m === 0) {
            velocity.add(force);
            velocity.normalize();
            velocity.multiplyByScalar(this.maxVelocity);
        } else {
            const scalar = (dt * this.timeStep) / particle.m;
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

    forceBH(particle, node) {
        if (!particle || particle.removed || !node) {
            return;
        }

        if (!node.nodes && particle.pos.isEqual(node)) {
            return;
        }

        this.dist.set((node.nodes) ? node.centerOfMass : node.pos);
        this.dist.substract(particle.pos);

        const d = this.dist.getLength();

        if (node.nodes && (node.size / d > this.theta)) {
            for (const child of node.nodes) {
                if (child) {
                    this.forceBH(particle, child);
                    if (particle.removed) {
                        return;
                    }
                }
            }

            return;
        }

        let distLength = d * this.scaleFactor;
        if (!this.useCollide) {
            distLength = Math.max(distLength, this.minDistance);
        }

        if (this.useCollide && !node.nodes) {
            for (const otherParticle of node.particles) {
                if (otherParticle.removed) {
                    continue;
                }

                const rr = (particle.r + otherParticle.r) / (2 * this.scaleFactor);
                if (distLength - rr < this.minDistance) {
                    const collideResult = this.collide(particle, otherParticle);
                    if (particle.removed || collideResult) {
                        return;
                    }
                }
            }
        }

        if (!distLength) {
            return;
        }

        this.dist.divideByScalar(distLength);
        const d2 = distLength * distLength;

        if (particle.charge && node.charge) {
            const forceSign = particle.attract(node) ? 1 : -1;
            const emForce = (K * forceSign * Math.abs(particle.charge * node.charge)) / d2;
            particle.force.addScaled(this.dist, emForce);
        }

        const r2 = (this.useSoftening)
            ? d2 * Math.sqrt(d2 + this.SOFTENING)
            : d2;

        const mass = (node.nodes) ? node.mass : node.m;

        const gForce = (G * Math.abs(particle.m * mass)) / r2;
        particle.force.addScaled(this.dist, gForce);
        if (!particle.force.isValid()) {
            throw new Error('NaN');
        }
    }

    calculate(dt) {
        if (!dt) {
            return;
        }

        if (!this.addInstantly) {
            this.newParticles = [];
        }

        if (this.useBarnesHut) {
            this.tree = new OctTree({
                x: this.boundingOffset,
                y: this.boundingOffset,
                z: this.boundingOffset,
            },
                this.boundingSize,
            );
            this.particles.forEach((p) => {
                p.resetForce();
                this.tree.insert(p);
            });
            this.particles.forEach((p) => {
                this.forceBH(p, this.tree);
            });
        } else {
            this.particles.forEach((p) => p.resetForce());
            this.particles.forEach((p, ind) => this.force(p, ind));
        }

        this.particles = this.particles.filter((p) => !p.removed);

        if (!this.addInstantly) {
            this.particles.push(...this.newParticles);
        }
        if (this.useSpontaneous) {
            this.spontaneous();
        }

        this.particles.forEach((p) => this.applyForce(p, dt));
    }
}
