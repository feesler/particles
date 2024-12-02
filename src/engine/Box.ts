import { Vector } from './Vector.ts';
import { EPSILON, AXES, intersectPlane } from '../utils.ts';
import { Axis, PlanePoint } from '../types.ts';
import { Object3D, Point3D, ProjectionFunc } from './types.ts';
import { CanvasFrame } from '../CanvasFrame.ts';

export class Box {
    halfSize: Vector;
    vertices: Vector[];
    edges: [number, number][];

    normals: Object3D<Vector>;

    planePoints: Object3D<PlanePoint>;

    constructor(width: number, height: number, depth: number) {
        const hw = width / 2;
        const hh = height / 2;
        const hd = depth / 2;

        this.halfSize = new Vector(hw, hh, hd);

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

        // Prepare normales to each side of box
        this.normals = {
            x: new Vector(1, 0, 0),
            y: new Vector(0, 1, 0),
            z: new Vector(0, 0, 1),
        };

        this.planePoints = {
            x: { left: 1, right: 0 },
            y: { left: 0, right: 4 },
            z: { left: 3, right: 0 },
        };
    }

    /** Return point of plane pointed by specified vector */
    getPlanePoint(axis: Axis, vector: Vector) {
        const normal = this.normals[axis];
        const dp = vector.dotProduct(normal);

        if (dp === 0) {
            return null;
        }

        const planeAxis = this.planePoints[axis];
        return this.vertices[(dp > 0) ? planeAxis.left : planeAxis.right];
    }

    rotate(alpha: number, beta: number, gamma: number) {
        for (const vert of this.vertices) {
            vert.rotateAroundX(alpha);
            vert.rotateAroundY(beta);
            vert.rotateAroundZ(gamma);
        }

        for (const axis of AXES) {
            const normal = this.normals[axis];
            normal.rotateAroundX(alpha);
            normal.rotateAroundY(beta);
            normal.rotateAroundZ(gamma);
        }
    }

    /** Returns intersection point of screen plane(z=0) by line specified by points A and B */
    getIntersectPoint(A: Point3D, B: Point3D) {
        const t = -A.z / (B.z - A.z);
        const x = t * (B.x - A.x) + A.x;
        const y = t * (B.y - A.y) + A.y;
        return new Vector(x, y, 0);
    }

    draw(frame: CanvasFrame, shift: Vector, projectionFunc: ProjectionFunc) {
        let maxZ = 0;

        for (const vert of this.vertices) {
            const v = vert.copy();
            v.add(shift);
            maxZ = Math.max(maxZ, v.z);
        }

        for (const edge of this.edges) {
            let fromVert = this.vertices[edge[0]].copy();
            fromVert.add(shift);

            let toVert = this.vertices[edge[1]].copy();
            toVert.add(shift);

            if (fromVert.z < 0 && toVert.z < 0) {
                continue;
            }
            if (fromVert.z < 0 || toVert.z < 0) {
                const C = this.getIntersectPoint(fromVert, toVert);
                if (fromVert.z < 0) {
                    fromVert = C;
                } else {
                    toVert = C;
                }
            }

            const midZ = (fromVert.z + toVert.z) / 2;
            const rC = Math.round(255 * (1 - (midZ / maxZ)));

            const p0 = projectionFunc(fromVert);
            const p1 = projectionFunc(toVert);

            frame.drawLine(p0.x, p0.y, p1.x, p1.y, rC, rC, rC, 255);
        }
    }

    getIntersection(A: Vector, B: Vector) {
        const dp: Partial<Point3D> = {};
        const outAxes = [];

        const direction = B.copy();
        direction.substract(A);

        if (direction.x === 0 && direction.y === 0 && direction.z === 0) {
            return null;
        }

        for (const axis of AXES) {
            dp[axis] = B.dotProduct(this.normals[axis]);

            const out = Math.abs(dp[axis]) - this.halfSize[axis];
            if (out > 0) {
                outAxes.push({
                    axis,
                    out,
                });
            }
        }

        if (!outAxes.length) {
            return null;
        }

        if (outAxes.length > 1) {
            outAxes.sort((a, b) => a.out - b.out);
        }

        let correctIS = false;
        let planeNormal;
        let intersection;
        const results = [];

        while (outAxes.length > 0 && !correctIS) {
            const outAxis = outAxes.pop();
            if (!outAxis) {
                continue;
            }
            const planePoint = this.getPlanePoint(outAxis.axis, direction);
            if (!planePoint) {
                continue;
            }
            planeNormal = this.normals[outAxis.axis];

            intersection = intersectPlane(planePoint, planeNormal, A, B);
            if (!intersection) {
                continue;
            }

            correctIS = true;
            for (const axis of AXES) {
                if (axis === outAxis.axis) {
                    continue;
                }

                const idp = intersection.dotProduct(this.normals[axis]);
                const err = Math.abs(idp) - this.halfSize[axis];
                if (err > EPSILON) {
                    results.push({
                        point: intersection.copy(),
                        normal: planeNormal,
                        error: err,
                    });
                    correctIS = false;
                    break;
                }
            }
        }

        if (correctIS) {
            results.push({
                point: intersection,
                normal: planeNormal,
            });
        } else {
            if (!results.length) {
                throw new Error('Intersections not found');
            }

            if (results.length > 0) {
                results.sort((a, b) => a.error - b.error);
            }
        }

        return results[0];
    }
}
