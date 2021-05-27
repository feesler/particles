export class Vector {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    isValid() {
        return !Number.isNaN(this.x) && !Number.isNaN(this.y) && !Number.isNaN(this.z);
    }

    copy() {
        return new Vector(this.x, this.y, this.z);
    }

    getLength() {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    }

    getLengthSquare() {
        return this.x * this.x + this.y * this.y + this.z * this.z;
    }

    dotProduct(vector) {
        return this.x * vector.x + this.y * vector.y + this.z * vector.z;
    }

    crossProduct(vector) {
        const x = this.y * vector.z - this.z * vector.y;
        const y = this.z * vector.x - this.x * vector.z;
        const z = this.x * vector.y - this.y * vector.x;
        this.x = x;
        this.y = y;
        this.z = z;
    }

    add(vector) {
        this.x += vector.x;
        this.y += vector.y;
        this.z += vector.z;
    }

    substract(vector) {
        this.x -= vector.x;
        this.y -= vector.y;
        this.z -= vector.z;
    }

    multiply(vector) {
        this.x *= vector.x;
        this.y *= vector.y;
        this.z *= vector.z;
    }

    divide(vector) {
        this.x /= vector.x;
        this.y /= vector.y;
        this.z /= vector.z;
    }

    multiplyByScalar(scalar) {
        this.x *= scalar;
        this.y *= scalar;
        this.z *= scalar;
    }

    divideByScalar(scalar) {
        this.x /= scalar;
        this.y /= scalar;
        this.z /= scalar;
    }

    addScaled(vector, scalar) {
        this.x += scalar * vector.x;
        this.y += scalar * vector.y;
        this.z += scalar * vector.z;
    }

    substractScaled(vector, scalar) {
        this.x -= scalar * vector.x;
        this.y -= scalar * vector.y;
        this.z -= scalar * vector.z;
    }

    normalize() {
        this.divideByScalar(this.getLength());
    }

    rotateAroundX(angle) {
        if (angle === 0) {
            return;
        }

        const Y = this.y;
        const Z = this.z;

        this.y = Y * Math.cos(angle) - Z * Math.sin(angle);
        this.z = Y * Math.sin(angle) + Z * Math.cos(angle);
    }

    rotateAroundY(angle) {
        if (angle === 0) {
            return;
        }

        const X = this.x;
        const Z = this.z;

        this.x = X * Math.cos(angle) + Z * Math.sin(angle);
        this.z = -X * Math.sin(angle) + Z * Math.cos(angle);
    }

    rotateAroundZ(angle) {
        if (angle === 0) {
            return;
        }

        const X = this.x;
        const Y = this.y;

        this.x = X * Math.cos(angle) - Y * Math.sin(angle);
        this.y = X * Math.sin(angle) + Y * Math.cos(angle);
    }
}
