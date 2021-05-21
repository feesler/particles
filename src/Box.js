import { Vector } from './Vector.js';

export class Box {
    constructor(width, height, depth) {
        const hw = width / 2;
        const hh = height / 2;
        const hd = depth / 2;

        this.vertices = [
            new Vector(-hw, hh, -hd),
            new Vector(hw, hh, -hd),
            new Vector(hw, hh, hd),
            new Vector(-hw, hh, hd),
            new Vector(-hw, -hh, -hd),
            new Vector(hw, -hh, -hd),
            new Vector(hw, -hh, hd),
            new Vector(-hw, -hh, hd),
        ];

        this.edges = [
            [0, 1],
            [1, 2],
            [2, 3],
            [3, 0],
            [0, 4],
            [1, 5],
            [2, 6],
            [3, 7],
            [4, 5],
            [5, 6],
            [6, 7],
            [7, 4],
        ];
    }

    rotate(alpha, beta, gamma) {
        for (const vert of this.vertices) {
            vert.rotateAroundX(alpha);
            vert.rotateAroundY(beta);
            vert.rotateAroundZ(gamma);
        }
    }

    draw(frame, shift, xF, yF) {
        let maxZ = 0;

        for (const vert of this.vertices) {
            const v = vert.copy();
            v.add(shift);
            maxZ = Math.max(maxZ, v.z);
        }

        for (const edge of this.edges) {
            const fromVert = this.vertices[edge[0]].copy();
            fromVert.add(shift);

            const toVert = this.vertices[edge[1]].copy();
            toVert.add(shift);

            const midZ = (fromVert.z + toVert.z) / 2;
            const rC = Math.round(255 * (1 - (midZ / maxZ)));

            const x0 = xF(fromVert);
            const y0 = yF(fromVert);
            const x1 = xF(toVert);
            const y1 = yF(toVert);

            frame.drawLine(x0, y0, x1, y1, rC, rC, rC, 255);
        }
    }
}
