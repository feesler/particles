import { Particle } from './Particle.js';
import { Proton } from './Proton.js';
import { Electron } from './Electron.js';
import { Star } from './Star.js';
import { Planet } from './Planet.js';
import { Field } from './Field.js';

const rand = Math.random;
const animationDelay = 10;
const INITIAL_SCALE = 0.1;
const SCALE_STEP = 0.01;

let scaleFactorElem = null;

async function update(field) {

    await field.calculate();
    field.drawFrame();
    field.scaleFactor += SCALE_STEP;

    scaleFactorElem.textContent = field.scaleFactor;

    setTimeout(update.bind(null, field), animationDelay);
}

function initStars(f) {
    for (let i = 0; i < 1000; i++) {
        const chance = rand();
        const xpos = Math.round(rand() * f.width);
        const ypos = Math.round(rand() * f.height);

        let particle;

        if (chance > 0.9) {
            particle = new Star(xpos, ypos, 1000000000);
        } else if (chance > 0.7) {
            const mass = rand() * 10000000 + 100000;
            particle = new Star(xpos, ypos, mass);
        } else {
            particle = new Planet(xpos, ypos);
            particle.m = rand() * 1000 + 1;
        }

        f.add(particle);
    }
}

function initParticles(f) {
    for (let i = 0; i < 1000; i++) {
        const chance = rand();
        const xpos = Math.round(rand() * f.width);
        const ypos = Math.round(rand() * f.height);

        let particle;

        if (chance > 0.7) {
            particle = new Proton(xpos, ypos);
        } else {
            particle = new Electron(xpos, ypos);
        }

        particle.dx = rand() * 0.2 - 0.1;
        particle.dy = rand() * 0.2 - 0.1;

        f.add(particle);
    }
}

function initVelocityTest(f) {
    f.add(new Star(f.width - 300, f.height / 2, 10000000000));

    f.add(new Star(10, 10, 1000));
    f.add(new Star(10, 100, 10000));
    f.add(new Star(10, 200, 100000));
    f.add(new Star(10, 300, 1000000));
}

function drawMaxVelocity(f) {
    const frame = f.context2d.createImageData(f.width, f.height);
    const yF = (y) => f.height - y;

    const MAX_SPEED = 300;
    const scaleFactor = 3;
    const c = MAX_SPEED / scaleFactor;
    const relVelocity = (velocity) => c * Math.tanh(velocity / c);

    for (let x = 0; x < 1000; x += 1) {
        let v = x;
        f.putPixel(frame, x, yF(v), 128, 255, 128, 255);
        f.putPixel(frame, x, yF(c), 128, 255, 128, 255);
        let y = relVelocity(v);
        f.putPixel(frame, x, yF(y), 255, 128, 80, 255);
    }

    f.context2d.putImageData(frame, 0, 0);
}

function init() {
    const f = new Field(document.getElementById('cnv'), INITIAL_SCALE);

    scaleFactorElem = document.getElementById('scalefactor');

    if (1) {
        drawMaxVelocity(f);
    } else {
        initStars(f);
        //initParticles(f);
        //initVelocityTest(f);

        f.drawFrame();

        setTimeout(update.bind(null, f), animationDelay);
    }

}

document.addEventListener('DOMContentLoaded', init);