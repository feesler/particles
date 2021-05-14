import { Particle } from './Particle.js';
import { Proton } from './Proton.js';
import { Electron } from './Electron.js';
import { Star } from './Star.js';
import { Planet } from './Planet.js';
import { Field } from './Field.js';

const rand = Math.random;
const animationDelay = 0;
const SCALE_FACTOR = 3;

async function update(field) {

    await field.calculate();
    field.drawFrame();
    //field.scaleFactor += 0.0001;

    setTimeout(update.bind(null, field), animationDelay);
}

function initStars(f) {
    for (let i = 0; i < 1000; i++) {
        const chance = rand();
        const xpos = Math.round(rand() * f.width);
        const ypos = Math.round(rand() * f.height);

        let particle;

        if (chance > 0.9) {
            particle = new Star(xpos, ypos);
            particle.m = rand() * 10000000 + 100000;
        } else {
            particle = new Planet(xpos, ypos);
            particle.m = rand() * 1000 + 1;
        }

        particle.dx = rand() * 0.2 - 0.1;
        particle.dy = rand() * 0.2 - 0.1;

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

function initSpeedTest(f) {
    let star;

    star = new Star(10, 10);
    star.dx = 0.1;
    f.add(star);

    star = new Star(10, 100);
    star.dx = 1;
    f.add(star);

    star = new Star(10, 200);
    star.dx = 10;
    f.add(star);

    star = new Star(10, 300);
    star.dx = 100;
    f.add(star);
}

function testMassVelocity(f) {
    const frame = f.context2d.createImageData(f.width, f.height);


    for (let x = 1, v = 1; x < 100; x += 1, v *= 10) {
        let y = x;
        let yf = f.height / 2 - y;

        f.putPixel(frame,
            x,
            yf,
            128,
            255,
            128,
            255,
        );

        y = Math.log(1 / v);
        yf = f.height / 2 - y;
        f.putPixel(frame,
            x,
            yf,
            255,
            128,
            80,
            255,
        );
    }

    f.context2d.putImageData(frame, 0, 0);
}


function init() {
    const f = new Field(document.getElementById('cnv'), SCALE_FACTOR);

    //initStars(f);
    //initParticles(f);
    testMassVelocity(f);
    /*
        initSpeedTest(f);


        f.drawFrame();

        setTimeout(update.bind(null, f), animationDelay);
    */
}

document.addEventListener('DOMContentLoaded', init);