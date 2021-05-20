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
        this.y = this.y * Math.cos(angle) - this.z * Math.sin(angle);
        this.z = this.y * Math.sin(angle) + this.z * Math.cos(angle);
    }

    rotateAroundY(angle) {
        this.x = this.x * Math.cos(angle) + this.z * Math.sin(angle);
        this.z = -this.x * Math.sin(angle) + this.z * Math.cos(angle);
    }

    rotateAroundZ(angle) {
        this.x = this.x * Math.cos(angle) - this.y * Math.sin(angle);
        this.y = this.x * Math.sin(angle) + this.y * Math.cos(angle);
    }
}
