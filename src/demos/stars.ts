import { Star } from '../particles/Star.ts';
import { Planet } from '../particles/Planet.ts';
import { rand } from '../utils.ts';
import { View } from '../types.ts';

export function initStars(view: View) {
    const PARTICLES_COUNT = 2000;
    const { field } = view;
    if (!field?.center) {
        return;
    }

    field.setScaleFactor(0.1);
    field.setTimeStep(0.01);
    field.useCollide = true;
    field.restoreCollided = true;
    field.useSoftening = false;
    view.setScaleStep(0.001);

    for (let i = 0; i < PARTICLES_COUNT; i += 1) {
        const chance = rand();
        const xPos = rand(-field.center.x, field.center.x);
        const yPos = rand(-field.center.y, field.center.y);
        const zPos = rand(-field.center.z, field.center.z);

        let particle;

        if (chance > 0.9) {
            particle = new Star(xPos, yPos, zPos, 10000000000);
        } else if (chance > 0.7) {
            const mass = rand(100000, 10000000);
            particle = new Star(xPos, yPos, zPos, mass);
        } else {
            const mass = rand(1, 1000);
            particle = new Planet(xPos, yPos, zPos, mass);
        }

        field.push(particle);
    }
}
