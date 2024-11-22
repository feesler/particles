import { Vector } from '../../engine/Vector.js';
import { Box } from '../../engine/Box.js';

export class Box3dDemo {
    getProps() {
        return {
            useWebGL: false,
            useField: false,
        };
    }

    init(view) {
        const { canvas } = view;

        const DIST = 1000; /* Distance from camera to canvas */
        const Z_SHIFT = 0; /* Distance from canvas to z=0 plane */
        const HH = canvas.height / 2;
        const HW = canvas.width / 2;

        const projectToScreen = (vector) => {
            const zDist = DIST + vector.z + Z_SHIFT;
            return {
                x: HW - (DIST * (HW - vector.x)) / zDist,
                y: HH - (DIST * (HH - vector.y)) / zDist,
                z: vector.z,
            };
        };

        const CUBE_X = 500;
        const CUBE_Y = 100;
        const CUBE_Z = 200;
        const CUBE_WIDTH = 400;
        const CUBE_HEIGHT = 100;
        const CUBE_DEPTH = 100;

        const cube = new Box(CUBE_WIDTH, CUBE_HEIGHT, CUBE_DEPTH);

        const cubeCenter = new Vector(
            CUBE_X + CUBE_WIDTH / 2,
            CUBE_Y + CUBE_HEIGHT / 2,
            CUBE_Z + CUBE_DEPTH / 2,
        );

        const draw3dFrame = () => {
            const frame = canvas.createFrame();

            cube.draw(frame, cubeCenter, projectToScreen);

            canvas.drawFrame(frame);
        };

        const update3dFrame = () => {
            cube.rotate(0, 0.1, 0);
            draw3dFrame();
            setTimeout(() => update3dFrame(), 100);
        };

        draw3dFrame();
        setTimeout(() => update3dFrame(), 100);
    }
}
