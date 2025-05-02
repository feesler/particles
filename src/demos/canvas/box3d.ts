import { Vector } from '../../engine/Vector/Vector.ts';
import { Box } from '../../engine/Box/Box.ts';
import { View } from '../../types.ts';
import { Canvas2DRef } from '../../components/Canvas2D/Canvas2D.tsx';
import { DemoClass } from '../index.ts';

export class Box3dDemo implements DemoClass {
    boxTimeout: number = 0;

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

        const DIST = 1000; /* Distance from camera to canvas */
        const Z_SHIFT = 0; /* Distance from canvas to z=0 plane */
        const HH = canvas.elem.height / 2;
        const HW = canvas.elem.width / 2;

        const projectToScreen = (vector: Vector) => {
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
            if (!frame) {
                return;
            }

            cube.draw(frame, cubeCenter, projectToScreen);

            canvas.drawFrame(frame);
        };

        const update3dFrame = () => {
            cube.rotate(0, 0.1, 0);
            draw3dFrame();
            this.clear();
            this.boxTimeout = window.setTimeout(() => update3dFrame(), 100);
        };

        draw3dFrame();
        this.clear();
        this.boxTimeout = window.setTimeout(() => update3dFrame(), 100);
    }

    clear(): void {
        if (this.boxTimeout) {
            window.clearTimeout(this.boxTimeout);
            this.boxTimeout = 0;
        }
    }
}
