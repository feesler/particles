import { Planet } from '../particles/Planet.js';
import { DarkParticle } from '../particles/DarkParticle.js';
import { rand } from '../utils.js';

export function initGas(view) {
    const PARTICLES_COUNT = 2000;
    const { field } = view;

    field.setScaleFactor(0.01);
    field.setTimeStep(0.1);
    view.setScaleStep(0.001);

    for (let i = 0; i < PARTICLES_COUNT; i += 1) {
        const chance = rand();
        const xPos = rand(-field.center.x, field.center.x);
        const yPos = rand(-field.center.y, field.center.y);
        const zPos = rand(-field.center.z, field.center.z);

        let particle;

        if (chance > 0.7) {
            particle = new Planet(xPos, yPos, zPos, 10000);
        } else {
            particle = new DarkParticle(xPos, yPos, zPos);
        }

        field.push(particle);
    }
}
