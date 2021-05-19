import { Vector } from './Vector.js';
import { Proton } from './Proton.js';
import { Electron } from './Electron.js';
import { Star } from './Star.js';
import { Planet } from './Planet.js';
import { Field } from './Field.js';

const rand = Math.random;
const animationDelay = 10;
const INITIAL_SCALE = 0.1;
let SCALE_STEP = 0.01;
const dt = 0.1;

let scaleFactorElem = null;
let countElem = null;

async function update(field) {

    await field.calculate();
    field.drawFrame();
    field.setScaleFactor(field.scaleFactor + SCALE_STEP);

    scaleFactorElem.textContent = field.scaleFactor;
    countElem.textContent = field.particles.length;

    setTimeout(update.bind(null, field), animationDelay);
}

function initStars(f) {
    f.setScaleFactor(0.1);
    f.setTimeStep(0.1);
    SCALE_STEP = 0.001;

    for (let i = 0; i < 1500; i++) {
        const chance = rand();
        const xPos = Math.round(rand() * f.width);
        const yPos = Math.round(rand() * f.height);
        const zPos = Math.round(rand() * f.depth);

        let particle;

        if (chance > 0.9) {
            particle = new Star(xPos, yPos, zPos, 1000000000);
        } else if (chance > 0.7) {
            const mass = rand() * 10000000 + 100000;
            particle = new Star(xPos, yPos, zPos, mass);
        } else {
            const mass = rand() * 1000 + 1;
            particle = new Planet(xPos, yPos, zPos, mass);
        }

        f.add(particle);
    }
}

function initPlanetarySystem(f) {
    f.setScaleFactor(5);
    f.setTimeStep(0.1);
    SCALE_STEP = 0;

    f.add(new Star(f.width / 2, f.height / 2, f.depth / 2, 1.9 * 10000000));

    let xPos, yPos, zPos;
    let planet;
    let mass;

    const AU = 150;
    const EM = 5.9;


    planet = new Planet(f.width / 2 + AU * 0.38, f.height / 2, f.depth / 2, EM * 0.382);
    planet.velocity.z = 0.4;
    f.add(planet);

    planet = new Planet(f.width / 2 + AU * 0.72, f.height / 2, f.depth / 2, EM * 0.815);
    planet.velocity.z = 0.3;
    f.add(planet);

    planet = new Planet(f.width / 2 + AU, f.height / 2, f.depth / 2, EM);
    planet.velocity.z = 0.5;
    f.add(planet);

    planet = new Planet(f.width / 2 + AU * 1.52, f.height / 2, f.depth / 2, EM * 0.107);
    planet.velocity.z = 0.2;
    f.add(planet);

    planet = new Planet(f.width / 2 + AU * 5.2, f.height / 2, f.depth / 2, EM * 318);
    planet.velocity.z = 0.1;
    f.add(planet);


}

function initParticles(f) {
    f.setScaleFactor(1);
    SCALE_STEP = 0;

    for (let i = 0; i < 1000; i++) {
        const chance = rand();
        const xPos = Math.round(rand() * f.width);
        const yPos = Math.round(rand() * f.height);
        const zPos = Math.round(rand() * f.depth);

        let particle;

        if (chance > 0.7) {
            particle = new Proton(xPos, yPos, zPos);
        } else {
            particle = new Electron(xPos, yPos, zPos);
        }

        particle.velocity.x = rand() * 0.2 - 0.1;
        particle.velocity.y = rand() * 0.2 - 0.1;
        particle.velocity.z = rand() * 0.2 - 0.1;

        f.add(particle);
    }
}

function initVelocityTest(f) {
    f.add(new Star(f.width - 300, f.height / 2, 300, 10000000000));

    f.add(new Star(10, 10, 10, 1000));
    f.add(new Star(10, 100, 100, 10000));
    f.add(new Star(10, 200, 200, 100000));
    f.add(new Star(10, 300, 300, 1000000));
}

function initDepthTest(f) {
    const D = 1;

    f.add(new Star(D, D, D));
    f.add(new Star(f.width - D, D, D));
    f.add(new Star(D, f.height - D, D));
    f.add(new Star(D, D, f.depth - D));
    f.add(new Star(D, f.height - D, f.depth - D));
    f.add(new Star(f.width - D, D, f.depth - D));
    f.add(new Star(f.width - D, f.height - D, D));
    f.add(new Star(f.width - D, f.height - D, f.depth - D));
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

function draw3D(canvas) {
    let ALPHA = -Math.PI / 8;
    let BETA = Math.PI / 8;
    const yF = (v) => v.y * Math.cos(ALPHA) + v.z * Math.sin(ALPHA);
    const xF = (v) => v.x * Math.cos(BETA) + v.z * Math.sin(BETA);

    const CUBE_X = 100;
    const CUBE_Y = 100;
    const CUBE_Z = 0;
    const CUBE_WIDTH = 200;
    const CUBE_HEIGHT = 100;
    const CUBE_DEPTH = 200;

    const vertices = [
        new Vector(CUBE_X, CUBE_Y, CUBE_Z),
        new Vector(CUBE_X + CUBE_WIDTH, CUBE_Y, CUBE_Z),
        new Vector(CUBE_X, CUBE_Y + CUBE_HEIGHT, CUBE_Z),
        new Vector(CUBE_X, CUBE_Y, CUBE_Z + CUBE_DEPTH),
        new Vector(CUBE_X, CUBE_Y + CUBE_HEIGHT, CUBE_Z + CUBE_DEPTH),
        new Vector(CUBE_X + CUBE_WIDTH, CUBE_Y, CUBE_Z + CUBE_DEPTH),
        new Vector(CUBE_X + CUBE_WIDTH, CUBE_Y + CUBE_HEIGHT, CUBE_Z),
        new Vector(CUBE_X + CUBE_WIDTH, CUBE_Y + CUBE_HEIGHT, CUBE_Z + CUBE_DEPTH),
    ];

    const draw3dFrame = () => {
        const frame = canvas.context2d.createImageData(canvas.width, canvas.height);
        for (const vert of vertices) {
            let x = xF(vert);
            let y = yF(vert);

            canvas.putPixel(frame, x, y, 255, 255, 255, (vert.z > CUBE_Z) ? 128 : 255);
        }

        canvas.context2d.putImageData(frame, 0, 0);
    };

    const update3dFrame = () => {
        ALPHA += 0.1;
        draw3dFrame();
        setTimeout(() => update3dFrame(), 100);
    };

    draw3dFrame();
    //setTimeout(() => update3dFrame(), 100);
}

function init() {
    const canvas = {
        elem: document.getElementById('cnv'),
        putPixel: function (frame, x, y, r, g, b, a) {
            const rx = Math.round(x);
            const ry = Math.round(y);
            let ind = ry * (this.width * 4) + rx * 4;

            frame.data[ind] = r;
            frame.data[ind + 1] = g;
            frame.data[ind + 2] = b;
            frame.data[ind + 3] = a;
        },
    };
    canvas.context2d = canvas.elem.getContext('2d');
    canvas.height = parseInt(canvas.elem.getAttribute('height'));
    canvas.width = parseInt(canvas.elem.getAttribute('width'));

    scaleFactorElem = document.getElementById('scalefactor');
    countElem = document.getElementById('particlescount');

    if (0) {
        //drawMaxVelocity(f);
        draw3D(canvas);
    } else {
        const f = new Field(canvas.elem, INITIAL_SCALE, dt);
        //initPlanetarySystem(f);
        //initStars(f);
        initParticles(f);
        //initVelocityTest(f);
        //initDepthTest(f);

        f.drawFrame();

        setTimeout(update.bind(null, f), animationDelay);
    }

}

document.addEventListener('DOMContentLoaded', init);