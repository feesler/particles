import { Canvas2DRef } from '../../components/Canvas2D/Canvas2D.ts';
import { DemoClass } from '../../demos.ts';
import { View } from '../../types.ts';

export class MaxVelocityDemo implements DemoClass {
    getProps() {
        return {
            useWebGL: false,
            useField: false,
        };
    }

    init(view: View) {
        const canvas = view.canvas as Canvas2DRef;
        if (!canvas?.elem) {
            return;
        }

        const frame = canvas.createFrame();
        if (!frame) {
            return;
        }

        const { height } = canvas.elem;

        const yF = (y: number) => height - y;

        const MAX_SPEED = 300;
        const scaleFactor = 3;
        const c = MAX_SPEED / scaleFactor;
        const relVelocity = (velocity: number) => c * Math.tanh(velocity / c);

        for (let x = 0; x < 1000; x += 1) {
            const v = x;
            frame.putPixel(x, yF(v), 128, 255, 128, 255);
            frame.putPixel(x, yF(c), 128, 255, 128, 255);
            const y = relVelocity(v);
            frame.putPixel(x, yF(y), 255, 128, 80, 255);
        }

        canvas.drawFrame(frame);
    }
}
