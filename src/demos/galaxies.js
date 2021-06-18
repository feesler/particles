import { Vector } from '../Vector.js';
import { Star } from '../particles/Star.js';
import { DarkParticle } from '../particles/DarkParticle.js';
import { rand } from '../utils.js';

export function initGalaxies(view) {
    const G_SIZE_LEFT = 150;
    const G_SIZE_RIGHT = 80;
    const { field } = view;

    field.setScaleFactor(4);
    field.setTimeStep(0.1);
    field.useCollide = false;
    view.setScaleStep(0.01);

    const leftPos = new Vector(-field.width / 4, 0, 0);
    const rightPos = new Vector(field.width / 4, 0, 0);

    for (let i = 0; i < 1000; i += 1) {
        const chance = rand();
        const dist = rand(0, G_SIZE_LEFT);
        const a = rand(0, Math.PI * 2);
        const xPos = Math.round(leftPos.x + dist * Math.cos(a));
        const yPos = Math.round(leftPos.y + dist * Math.sin(a));
        const zPos = Math.round(leftPos.z + rand(0, 10));

        let particle;

        if (chance > 0.9) {
            particle = new Star(xPos, yPos, zPos, 1000000000);
        } else if (chance > 0.7) {
            const mass = rand(100000, 10000000);
            particle = new Star(xPos, yPos, zPos, mass);
        } else {
            particle = new DarkParticle(xPos, yPos, zPos);
        }

        particle.velocity.x = rand() * 200;

        field.push(particle);
    }

    for (let i = 0; i < 500; i += 1) {
        const chance = rand();
        const dist = rand() * G_SIZE_RIGHT;
        const a = rand() * Math.PI * 2;
        const xPos = Math.round(rightPos.x + dist * Math.cos(a));
        const yPos = Math.round(rightPos.y + dist * Math.sin(a));
        const zPos = Math.round(rightPos.z + rand(0, 10));

        let particle;

        if (chance > 0.5) {
            particle = new Star(xPos, yPos, zPos, 1000000000);
        } else {
            particle = new DarkParticle(xPos, yPos, zPos);
        }

        particle.velocity.x = -rand() * 200;

        field.push(particle);
    }
}
