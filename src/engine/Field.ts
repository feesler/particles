import { Box } from './Box.ts';
import { Particle } from '../particles/Particle.ts';
import { Star } from '../particles/Star.ts';
import { Vector } from './Vector.ts';
import { Planet } from '../particles/Planet.ts';
import { rand } from '../utils.ts';
import { Photon } from '../particles/Photon.ts';
import { Electron } from '../particles/Electron.ts';
import { Positron } from '../particles/Positron.ts';
import { Gluon } from '../particles/Gluon.ts';
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
} from '../particles/types.ts';
import { OctTree, OctTreeChild } from './OctTree.ts';
import { Canvas } from '../types.ts';
import { Object3D, Rotation } from './types.ts';
import { CanvasWebGLRef } from '../components/CanvasWebGL/CanvasWebGL.ts';
import { CanvasFrame } from '../CanvasFrame.ts';
import { Canvas2DRef } from '../components/Canvas2D/Canvas2D.ts';

const K = 8.9 * 10;
const G = 6.67 * 0.0000001;
const MAX_SPEED = 150;
const DEPTH = 2000;
const MIN_DISTANCE = 0.05;
const MIN_HARD_DIST = 0.005;
const BORDER_LOSS = 0.1;
const BOUNDING_GAP = 10;

export class Field {
    canvas: Canvas;

    depth: number;
    xShift: number;
    yShift: number;
    width: number;
    height: number;

    DIST: number;
    Z_SHIFT: number;

    drawAllPaths: boolean;
    useCollide: boolean;
    restoreCollided: boolean;
    useSoftening: boolean;
    SOFTENING: number;

    addInstantly: boolean;
    useBarnesHut: boolean;
    useSpontaneous: boolean;
    useBoxBorder: boolean;
    useWebGL: boolean;
    drawNodes: boolean;

    tree: OctTree | null = null;
    boundingOffset: number = 0;
    boundingSize: number = 0;
    particleMin: number = 0;
    particleMax: number = 0;
    theta: number = 0;
    dist: Vector | null = null;

    rotation: Rotation = {
        alpha: 0,
        beta: 0,
        gamma: 0,
    };

    sceneNormals: Object3D<Vector> | null = null;

    box: Box | null = null;
    center: Vector | null = null;

    particles: Particle[] = [];
    newParticles: Particle[] = [];

    scaleFactor: number = 1;
    maxVelocity: number = 0;
    minDistance: number = 0;
    minHardDistance: number = 0;
    timeStep: number = 0;

    constructor(canvas: Canvas, scaleFactor: number, timeStep: number) {
        if (!canvas?.elem) {
            throw new Error('Invalid canvas');
        }

        this.canvas = canvas;

        this.depth = DEPTH;
        this.xShift = 0;
        this.yShift = 0;

        this.width = canvas.elem.width;
        this.height = canvas.elem.height;
        this.DIST = 1000;
        this.Z_SHIFT = 0;

        this.drawAllPaths = false; // true;
        this.useCollide = true;
        this.restoreCollided = true;
        this.useSoftening = false;
        this.SOFTENING = 2;
        this.addInstantly = true;
        this.newParticles = [];
        this.useSpontaneous = false;
        this.useBoxBorder = true;
        this.useWebGL = true;

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
            this.particleMin = 0;
            this.particleMax = 0;
            this.theta = 0.5;
            this.dist = new Vector();
        }

        this.rotation = {
            alpha: 0,
            beta: 0,
            gamma: 0,
        };

        this.createGeometry();
        this.setScaleFactor(scaleFactor);
        this.setTimeStep(timeStep);
    }

    createGeometry() {
        this.box = new Box(this.width, this.height, this.depth);
        this.center = new Vector(this.width / 2, this.height / 2, this.depth / 2);
    }

    onResize({ width, height }: { width: number; height: number; }) {
        this.width = width;
        this.height = height;

        this.createGeometry();
    }

    drawFrameByCircles() {
        if (!this.canvas || !this.center) {
            return;
        }

        this.canvas.clear();

        const p = new Vector();

        const length = this.particles?.length ?? 0;
        for (let index = 0; index < length; index++) {
            const particle = this.particles[index];
            if (!particle.draw) {
                continue;
            }

            p.set(particle.pos);
            p.add(this.center);

            const p0 = this.project(p);
            if (!p0) {
                continue;
            }

            this.canvas?.drawCircle(p0.x, p0.y, 0.5, particle.color);
        }
    }

    drawFrameWebGl() {
        const canvas = this.canvas as CanvasWebGLRef;
        if (!canvas) {
            return;
        }

        canvas.clear();

        const length = this.particles?.length ?? 0;
        for (let index = 0; index < length; index++) {
            const particle = this.particles[index];
            if (!particle.draw) {
                continue;
            }

            canvas.drawPoint(particle.pos, particle.color);
        }

        canvas.drawScene();
    }

    project(vector: Vector) {
        if (!this.center) {
            return null;
        }

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
        const length = this.particles?.length ?? 0;
        for (let index = 0; index < length; index++) {
            const particle = this.particles[index];
            this.particleMin = Math.min(
                this.particleMin,
                particle.pos.x,
                particle.pos.y,
                particle.pos.z,
            );

            this.particleMax = Math.max(
                this.particleMax,
                particle.pos.x,
                particle.pos.y,
                particle.pos.z,
            );
        }
        this.boundingOffset = this.particleMin - BOUNDING_GAP;
        this.boundingSize = this.particleMax - this.particleMin + BOUNDING_GAP * 2;
    }

    rotateVector(vector: Vector, alpha: number, beta: number, gamma: number) {
        vector.rotateAroundX(alpha);
        vector.rotateAroundY(beta);
        vector.rotateAroundZ(gamma);
    }

    rotate(alpha: number, beta: number, gamma: number) {
        this.box?.rotate(alpha, beta, gamma);

        const length = this.particles?.length ?? 0;
        for (let index = 0; index < length; index++) {
            const particle = this.particles[index];
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

    drawParticlePath(frame: CanvasFrame, particle: Particle) {
        if (!this.center) {
            return;
        }

        const p = new Vector();

        p.set(particle.pos);
        p.add(this.center);

        let p1 = this.project(p);
        if (!p1) {
            return;
        }

        while (particle.path.length > 0) {
            const prevPos = particle.path.pop();
            if (!prevPos) {
                continue;
            }

            p.set(prevPos);
            p.add(this.center);

            const p0 = this.project(p);
            if (!p0) {
                continue;
            }
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

    drawNode(frame: CanvasFrame, node: OctTree) {
        if (!node) {
            return;
        }

        const nodeBox = new Box(node.size, node.size, node.size);

        const boxCenter = node.offset.copy();
        boxCenter.addScalar(node.half);

        nodeBox.draw(frame, boxCenter, (v: Vector) => this.project(v)!);

        const length = node.nodes?.length ?? 0;
        for (let index = 0; index < length; index++) {
            const child = node.nodes[index];
            if (child && ('nodes' in child) && child.nodes) {
                this.drawNode(frame, child);
            }
        }
    }

    drawFrameByPixels() {
        const canvas = this.canvas as Canvas2DRef;
        if (!canvas || !this.box || !this.center) {
            return;
        }

        const frame = canvas.createFrame();
        if (!frame) {
            return;
        }

        this.box.draw(frame, this.center, (v: Vector) => this.project(v)!);

        this.particles.sort((a, b) => b.pos.z - a.pos.z);

        const p = new Vector();

        const length = this.particles?.length ?? 0;
        for (let index = 0; index < length; index++) {
            const particle = this.particles[index];
            if (!particle.draw) {
                continue;
            }

            p.set(particle.pos);
            p.add(this.center);

            const p0 = this.project(p);
            if (!p0) {
                continue;
            }

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

        canvas.drawFrame(frame);
    }

    drawFrame() {
        if (this.useWebGL) {
            this.drawFrameWebGl();
        } else {
            this.drawFrameByPixels();
        }
    }

    setScaleFactor(scaleFactor: number) {
        this.scaleFactor = scaleFactor;
        this.maxVelocity = (scaleFactor < 1) ? MAX_SPEED : (MAX_SPEED / scaleFactor);
        this.minDistance = MIN_DISTANCE / scaleFactor;
        this.minHardDistance = MIN_HARD_DIST / this.scaleFactor;
    }

    setTimeStep(timeStep: number) {
        this.timeStep = timeStep;
    }

    /** Add particle */
    add(particle: Particle) {
        if (this.addInstantly) {
            if (this.useBarnesHut) {
                const validPos = this.tree?.isValidPosition(particle.pos);
                if (validPos) {
                    this.tree?.insert(particle);
                    this.particles.push(particle);
                } else {
                    particle.remove();
                }
            } else {
                this.particles.push(particle);
            }
        } else {
            this.newParticles.push(particle);
        }
    }

    push(particle: Particle) {
        this.particles.push(particle);
    }

    force(particle: Particle, index: number) {
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
                    this.collide(particle, nq);
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

    resolveMassive(A: Particle, B: Particle) {
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

    annihilate(A: Particle, B: Particle) {
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

    resolveQuants(A: Particle, B: Particle) {
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

    collide(A: Particle, B: Particle) {
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
        if (!this.center || chance < 0.1) {
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
        if (!this.center) {
            return;
        }

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

    relVelocity(velocity: number) {
        return this.maxVelocity * Math.tanh(velocity / this.maxVelocity);
    }

    borderCondition(particle: Particle) {
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

            const intersection = this.box?.getIntersection(currentPos, destPos);
            if (!intersection?.point || !intersection.normal) {
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
                const photon = particle as Photon;
                photon.reflect();
            }

            if (!remVelocity.getLength()) {
                break;
            }
            // eslint-disable-next-line no-constant-condition
        } while (true);
    }

    sBorderCondition(particle: Particle) {
        particle.pos.add(particle.velocity);
    }

    applyForce(particle: Particle, dt: number) {
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

        if (this.useBoxBorder) {
            this.borderCondition(particle);
        } else {
            this.sBorderCondition(particle);
        }

        if (this.useBarnesHut) {
            this.particleMin = Math.min(
                this.particleMin,
                particle.pos.x,
                particle.pos.y,
                particle.pos.z,
            );

            this.particleMax = Math.max(
                this.particleMax,
                particle.pos.x,
                particle.pos.y,
                particle.pos.z,
            );
        }
    }

    fixVelocity(particle: Particle) {
        const totalVelocity = particle.velocity.getLength();
        const relativeVelocity = this.relVelocity(totalVelocity);
        if (relativeVelocity < totalVelocity) {
            const vScalar = relativeVelocity / totalVelocity;
            particle.velocity.multiplyByScalar(vScalar);
        }
    }

    forceBH(particle: Particle, node: OctTreeChild) {
        if (!this.dist || !particle || particle.removed || !node) {
            return;
        }

        const isTree = ('nodes' in node);
        const isTreeNode = ('particles' in node);
        if (
            !isTree
            && ('pos' in node)
            && particle.pos.isEqual(node.pos as Vector)
        ) {
            return;
        }

        this.dist.set((isTree) ? node.centerOfMass : node.pos);
        this.dist.substract(particle.pos);

        const d = this.dist.getLength();

        if (isTree && (node.size / d > this.theta)) {
            const length = node.nodes?.length ?? 0;
            for (let index = 0; index < length; index++) {
                const child = node.nodes[index];
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

        if (this.useCollide && !isTree && isTreeNode) {
            const particles = node.particles as Particle[];
            const length = particles?.length ?? 0;
            for (let index = 0; index < length; index++) {
                const otherParticle = particles[index];
                if (!otherParticle || otherParticle.removed) {
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
            const forceSign = particle.attract(node as Particle) ? 1 : -1;
            const emForce = (K * forceSign * Math.abs(particle.charge * node.charge)) / d2;
            particle.force.addScaled(this.dist, emForce);
        }

        const r2 = (this.useSoftening)
            ? d2 * Math.sqrt(d2 + this.SOFTENING)
            : d2;

        const mass = (isTree) ? node.mass : node.m;

        const gForce = (G * Math.abs(particle.m * mass)) / r2;
        particle.force.addScaled(this.dist, gForce);
        if (!particle.force.isValid()) {
            throw new Error('NaN');
        }
    }

    calculate(dt: number) {
        if (!dt) {
            return;
        }

        if (!this.addInstantly) {
            this.newParticles = [];
        }

        if (this.useBarnesHut) {
            if (!this.boundingOffset && !this.boundingSize) {
                this.calculateBoundingSize();
            }

            this.tree = new OctTree(
                new Vector(
                    this.boundingOffset,
                    this.boundingOffset,
                    this.boundingOffset,
                ),
                this.boundingSize,
            );
            this.particles.forEach((p) => {
                p.resetForce();
                this.tree!.insert(p);
            });
            this.particles.forEach((p) => {
                this.forceBH(p, this.tree!);
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

        if (this.useBarnesHut) {
            this.particleMin = 0;
            this.particleMax = 0;
        }

        this.particles.forEach((p) => this.applyForce(p, dt));

        if (this.useBarnesHut) {
            this.boundingOffset = this.particleMin - BOUNDING_GAP;
            this.boundingSize = this.particleMax - this.particleMin + BOUNDING_GAP * 2;
        }
    }
}
