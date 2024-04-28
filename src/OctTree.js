import { Vector } from './Vector.js';

export class OctTree {
    constructor(offset, size) {
        this.offset = new Vector();
        this.offset.set(offset);
        this.size = size;
        this.half = size / 2;

        this.corner = this.offset.copy();
        this.corner.addScalar(size);

        this.centerOfMass = this.offset.copy();
        this.centerOfMass.addScalar(this.half);
        this.mass = 0;
        this.charge = 0;

        this.nodes = [
            null, // front top left
            null, // front top right
            null, // front bottom left
            null, // from bottom right
            null, // rear top left
            null, // rear top right
            null, // rear bottom left
            null, // rear bottom right
        ];
    }

    isValidPosition(pos) {
        return (
            pos?.isValid()
            && pos.x >= this.offset.x
            && pos.x <= this.corner.x
            && pos.y >= this.offset.y
            && pos.y <= this.corner.y
            && pos.z >= this.offset.z
            && pos.z <= this.corner.z
        );
    }

    getNodeIndexByPos(pos) {
        if (!pos.isValid()) {
            throw new Error('Invalid position');
        }

        if (
            pos.x < this.offset.x
            || pos.x > this.corner.x
            || pos.y < this.offset.y
            || pos.y > this.corner.y
            || pos.z < this.offset.z
            || pos.z > this.corner.z
        ) {
            throw new Error('Invalid position');
        }

        const left = (this.corner.x - pos.x > this.half) ? 0 : 1;
        const top = (this.corner.y - pos.y > this.half) ? 0 : 2;
        const front = (this.corner.z - pos.z > this.half) ? 0 : 4;

        return front + top + left;
    }

    getOffsetByIndex(index) {
        if (index < 0 || index > 7) {
            throw new Error('Invalid index');
        }

        const xShift = (index & 0x1) ? this.half : 0;
        const yShift = (index & 0x2) ? this.half : 0;
        const zShift = (index & 0x4) ? this.half : 0;

        return {
            x: this.offset.x + xShift,
            y: this.offset.y + yShift,
            z: this.offset.z + zShift,
        };
    }

    insert(particle) {
        const ind = this.getNodeIndexByPos(particle.pos);
        const child = this.nodes[ind];

        if (child === null) {
            this.nodes[ind] = {
                pos: particle.pos.copy(),
                m: particle.m,
                charge: particle.charge,
                particles: [particle],
            };
        } else if (child.nodes) {
            child.insert(particle);
        } else if (particle.pos.isEqual(child.pos)) {
            child.m += particle.m;
            child.particles.push(particle);
        } else {
            const newOffset = this.getOffsetByIndex(ind);
            const newNode = new OctTree(newOffset, this.size / 2);
            newNode.insert(child);
            newNode.insert(particle);
            this.nodes[ind] = newNode;
        }

        this.mass += particle.m;
        this.charge += particle.charge;
        this.calculateCenterOfMass();
    }

    calculateCenterOfMass() {
        this.centerOfMass.multiplyByScalar(0);

        for (const node of this.nodes) {
            if (!node) {
                continue;
            }

            if (node.nodes) {
                this.centerOfMass.addScaled(node.centerOfMass, node.mass);
            } else {
                this.centerOfMass.addScaled(node.pos, node.m);
            }
        }

        if (this.mass > 0) {
            this.centerOfMass.divideByScalar(this.mass);
        }
    }
}
