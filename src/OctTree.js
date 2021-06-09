import { Vector } from './Vector.js';

class OctNode {
    constructor(offset, size, tree) {
        this.offset = new Vector();
        this.offset.set(offset);
        this.size = size;
        this.half = size / 2;
        this.tree = tree;

        this.corner = this.offset.copy();
        this.corner.addScalar(size);

        this.centerOfMass = this.offset.copy();
        this.centerOfMass.addScalar(this.half);
        this.mass = 0;

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

    getNodeIndexByPos(pos) {
        const fpos = {
            x: pos.x + this.tree.shift.x,
            y: pos.y + this.tree.shift.y,
            z: pos.z + this.tree.shift.z,
        };

        if (
            fpos.x < this.offset.x
            || fpos.x > this.corner.x
            || fpos.y < this.offset.y
            || fpos.y > this.corner.y
            || fpos.z < this.offset.z
            || fpos.z > this.corner.z
        ) {
            return null;
        }

        const left = (this.corner.x - fpos.x > this.half) ? 0 : 1;
        const top = (this.corner.y - fpos.y > this.half) ? 0 : 2;
        const front = (this.corner.z - fpos.z > this.half) ? 0 : 4;

        return front + top + left;
    }

    getOffsetByIndex(index) {
        if (index < 0 || index > 7) {
            return null;
        }

        const xShift = (index % 2) ? this.half : 0;
        const yShift = ((index % 4) > 1) ? this.half : 0;
        const zShift = ((index > 3) ? this.half : 0);

        return {
            x: this.offset.x + xShift,
            y: this.offset.y + yShift,
            z: this.offset.z + zShift,
        };
    }

    insert(particle) {
        const ind = this.getNodeIndexByPos(particle.pos);
        if (ind === null) {
            throw new Error('Invalid position');
        }

        const child = this.nodes[ind];
        if (child === null) {
            this.nodes[ind] = { pos: particle.pos.copy(), m: particle.m };
        } else if (child.nodes) {
            child.insert(particle);
        } else if (particle.pos.isEqual(child.pos)) {
            child.m += particle.m;
        } else {
            const newOffset = this.getOffsetByIndex(ind);
            const newNode = new OctNode(newOffset, this.size / 2, this.tree);
            newNode.insert(child);
            newNode.insert(particle);
            this.nodes[ind] = newNode;
        }

        this.mass += particle.m;
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

export class OctTree {
    constructor(size, shift) {
        this.size = size;
        this.root = null;
        this.shift = shift;
    }

    insert(particle) {
        if (!this.root) {
            this.root = new OctNode({ x: 0, y: 0, z: 0 }, this.size, this);
        }

        this.root.insert(particle);
    }
}
