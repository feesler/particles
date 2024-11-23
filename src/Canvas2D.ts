import { CanvasFrame } from './CanvasFrame.js';

export class Canvas2D {
    elem: HTMLDivElement;
    context: CanvasRenderingContext2D | null;
    width: number;
    height: number;

    constructor(elem: HTMLElement) {
        if (!(elem instanceof HTMLCanvasElement)) {
            throw new Error('Invalid canvas element');
        }

        this.elem = elem;
        this.context = elem.getContext('2d');
        this.width = elem.width;
        this.height = elem.height;
    }

    createFrame() {
        const image = this.context.createImageData(this.width, this.height);
        return new CanvasFrame(image);
    }

    drawFrame(frame) {
        this.context.putImageData(frame.image, 0, 0);
    }

    clear() {
        this.context.clearRect(0, 0, this.width, this.height);
    }

    drawCircle(x: number, y: number, radius: number, color: number) {
        const circleStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
        this.context.fillStyle = circleStyle;
        this.context.strokeStyle = circleStyle;

        this.context.beginPath();
        this.context.arc(x, y, radius, 0, Math.PI * 2);
        this.context.stroke();
    }
}
