export class MaxVelocityDemo {
    getProps() {
        return { useField: false };
    }

    init(view) {
        const frame = view.canvas.createFrame();
        const { height } = view.canvas;

        const yF = (y) => height - y;

        const MAX_SPEED = 300;
        const scaleFactor = 3;
        const c = MAX_SPEED / scaleFactor;
        const relVelocity = (velocity) => c * Math.tanh(velocity / c);

        for (let x = 0; x < 1000; x += 1) {
            const v = x;
            frame.putPixel(x, yF(v), 128, 255, 128, 255);
            frame.putPixel(x, yF(c), 128, 255, 128, 255);
            const y = relVelocity(v);
            frame.putPixel(x, yF(y), 255, 128, 80, 255);
        }

        view.canvas.drawFrame(frame);
    }
}
