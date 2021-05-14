import { Particle } from './Particle.js';
import { Proton } from './Proton.js';
import { Electron } from './Electron.js';
import { Star } from './Star.js';
import { Planet } from './Planet.js';
import { Field } from './Field.js';

const rand = Math.random;
const animationDelay = 0;
const SCALE_FACTOR = 10;

async function update(field) {

    await field.calculate();
    field.drawFrame();

    setTimeout(update.bind(null, field), animationDelay);
}

function init() {
    const f = new Field(document.getElementById('cnv'), SCALE_FACTOR);

    for (let i = 0; i < 500; i++) {
        const chance = rand();
        const xpos = Math.round(rand() * f.width);
        const ypos = Math.round(rand() * f.height);

        let particle;

        if (chance > 0.9) {
            particle = new Star(xpos, ypos);
            particle.m = rand() * 10000000 + 10000;
        } else {
            particle = new Planet(xpos, ypos);
            particle.m = rand() * 10 + 1;
        }

        particle.dx = rand() * 0.2 - 0.1;
        particle.dy = rand() * 0.2 - 0.1;

        f.add(particle);
    }

    f.drawFrame();

    setTimeout(update.bind(null, f), animationDelay);
}

document.addEventListener('DOMContentLoaded', init);