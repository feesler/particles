import { Star } from 'particles/Star.ts';
import { View } from 'shared/types.ts';

export function initVelocityTest(view: View) {
    const { field } = view;
    if (!field) {
        return;
    }

    field.setScaleFactor(0.1);
    field.setTimeStep(0.01);
    field.drawAllPaths = false;
    field.useCollide = false;
    view.setScaleStep(0);

    field.push(new Star(0, 0, 0, 100000000000));

    field.push(new Star(-field.width / 2 + 10, -field.height / 2 + 10, 0, 1000));
    field.push(new Star(-field.width / 2 + 10, -field.height / 2 + 100, 100, 10000));
    field.push(new Star(-field.width / 2 + 10, -field.height / 2 + 200, 200, 100000));
    field.push(new Star(-field.width / 2 + 10, -field.height / 2 + 300, 300, 1000000));
}
