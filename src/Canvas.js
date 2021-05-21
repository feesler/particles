import { CanvasFrame } from './CanvasFrame.js';

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
        const image = this.context2d.createImageData(this.width, this.height);
        return new CanvasFrame(image);
    }

    drawFrame(frame) {
        this.context2d.putImageData(frame.image, 0, 0);
    }
}
