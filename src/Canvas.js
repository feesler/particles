export class Canvas {
    constructor(elem) {
        if (!(elem instanceof HTMLCanvasElement)) {
            throw new Error('Invalid canvas element');
        }

        this.elem = elem;
        this.context2d = elem.getContext('2d');
        this.width = elem.width;
        this.height = elem.height;
    }

    createFrame() {
        return this.context2d.createImageData(this.width, this.height);
    }

    drawFrame(frame) {
        this.context2d.putImageData(frame, 0, 0);
    }

    putPixel(frame, x, y, r, g, b, a) {
        const rx = Math.round(x);
        const ry = Math.round(y);
        const ind = ry * (this.width * 4) + rx * 4;

        frame.data[ind] = r;
        frame.data[ind + 1] = g;
        frame.data[ind + 2] = b;
        frame.data[ind + 3] = a;
    }
}
