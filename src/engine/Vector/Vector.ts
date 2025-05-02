import { Object3D } from '../types.ts';

export class Vector implements Object3D<number> {
    x: number;

    y: number;

    z: number;

    constructor(x: number = 0, y: number = 0, z: number = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    isValid() {
        return !Number.isNaN(this.x) && !Number.isNaN(this.y) && !Number.isNaN(this.z);
    }

    set(vector: Vector) {
        this.x = vector.x;
        this.y = vector.y;
        this.z = vector.z;
    }

    copy() {
        return new Vector(this.x, this.y, this.z);
    }

    isEqual(vector: Vector) {
        return this.x === vector.x && this.y === vector.y && this.z === vector.z;
    }

    getLength() {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    }

    getLengthSquare() {
        return this.x * this.x + this.y * this.y + this.z * this.z;
    }

    dotProduct(vector: Vector) {
        return this.x * vector.x + this.y * vector.y + this.z * vector.z;
    }

    crossProduct(vector: Vector) {
        const x = this.y * vector.z - this.z * vector.y;
        const y = this.z * vector.x - this.x * vector.z;
        const z = this.x * vector.y - this.y * vector.x;
        this.x = x;
        this.y = y;
        this.z = z;
    }

    add(vector: Vector) {
        this.x += vector.x;
        this.y += vector.y;
        this.z += vector.z;
    }

    substract(vector: Vector) {
        this.x -= vector.x;
        this.y -= vector.y;
        this.z -= vector.z;
    }

    multiply(vector: Vector) {
        this.x *= vector.x;
        this.y *= vector.y;
        this.z *= vector.z;
    }

    divide(vector: Vector) {
        this.x /= vector.x;
        this.y /= vector.y;
        this.z /= vector.z;
    }

    addScalar(scalar: number) {
        this.x += scalar;
        this.y += scalar;
        this.z += scalar;
    }

    multiplyByScalar(scalar: number) {
        this.x *= scalar;
        this.y *= scalar;
        this.z *= scalar;
    }

    divideByScalar(scalar: number) {
        this.x /= scalar;
        this.y /= scalar;
        this.z /= scalar;
    }

    addScaled(vector: Vector, scalar: number) {
        this.x += scalar * vector.x;
        this.y += scalar * vector.y;
        this.z += scalar * vector.z;
    }

    substractScaled(vector: Vector, scalar: number) {
        this.x -= scalar * vector.x;
        this.y -= scalar * vector.y;
        this.z -= scalar * vector.z;
    }

    normalize() {
        const length = this.getLength();
        if (length !== 0) {
            this.divideByScalar(length);
        }
    }

    reflect(normale: Vector, loss: number = 1) {
        const dp = 2 * this.dotProduct(normale) * loss;
        this.substractScaled(normale, dp);
    }

    /** Returns new vector orthogonal to current instance */
    getOrthogonal() {
        const b0 = ((this.x < this.y) && (this.x < this.z)) ? 1 : 0;
        const b1 = ((this.y <= this.x) && (this.y < this.z)) ? 1 : 0;
        const b2 = ((this.z <= this.x) && (this.z <= this.y)) ? 1 : 0;

        const res = this.copy();
        res.crossProduct(new Vector(b0, b1, b2));
        return res;
    }

    rotateAroundX(angle: number) {
        if (angle === 0) {
            return;
        }

        const Y = this.y;
        const Z = this.z;

        this.y = Y * Math.cos(angle) - Z * Math.sin(angle);
        this.z = Y * Math.sin(angle) + Z * Math.cos(angle);
    }

    rotateAroundY(angle: number) {
        if (angle === 0) {
            return;
        }

        const X = this.x;
        const Z = this.z;

        this.x = X * Math.cos(angle) + Z * Math.sin(angle);
        this.z = -X * Math.sin(angle) + Z * Math.cos(angle);
    }

    rotateAroundZ(angle: number) {
        if (angle === 0) {
            return;
        }

        const X = this.x;
        const Y = this.y;

        this.x = X * Math.cos(angle) - Y * Math.sin(angle);
        this.y = X * Math.sin(angle) + Y * Math.cos(angle);
    }
}
