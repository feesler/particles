import { Proton } from '../particles/Proton.js';
import { Electron } from '../particles/Electron.js';
import { rand } from '../utils.js';

export function initParticles(view) {
    const PARTICLES_COUNT = 150;
    const { field } = view;

    field.setScaleFactor(0.0001);
    field.setTimeStep(0.1);
    field.addInstantly = true;
    field.useSpontaneous = true;
    field.useBarnesHut = true;
    view.setScaleStep(0);

    for (let i = 0; i < PARTICLES_COUNT; i += 1) {
        const chance = rand();
        const xPos = rand(-field.center.x, field.center.x);
        const yPos = rand(-field.center.y, field.center.y);
        const zPos = rand(-field.center.z, field.center.z);

        let particle;

        if (chance > 0.5) {
            particle = new Proton(xPos, yPos, zPos);
        } else {
            particle = new Electron(xPos, yPos, zPos);
        }

        particle.velocity.x = rand(-0.1, 0.1);
        particle.velocity.y = rand(-0.1, 0.1);
        particle.velocity.z = rand(-0.1, 0.1);

        field.push(particle);
    }
}
