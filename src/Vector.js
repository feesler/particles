export class Vector {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    copy() {
        return new Vector(this.x, this.y, this.z);
    }

    product(vector) {
        return this.x * vector.x + this.y * vector.y + this.z * vector.z;
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
