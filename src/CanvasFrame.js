export class CanvasFrame {
    constructor(image) {
        this.image = image;
    }

    putPixel(x, y, r, g, b, a) {
        const rx = Math.round(x);
        const ry = Math.round(y);
        if (
            rx < 0
            || rx > this.image.width
            || ry < 0
            || ry > this.image.height
        ) {
            return;
        }

        const ind = ry * (this.image.width * 4) + rx * 4;
        this.image.data[ind] = r;
        this.image.data[ind + 1] = g;
        this.image.data[ind + 2] = b;
        this.image.data[ind + 3] = a;
    }
}
