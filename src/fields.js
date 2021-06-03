import { Canvas } from './Canvas.js';
import { Vector } from './Vector.js';
import { Proton } from './particles/Proton.js';
import { Electron } from './particles/Electron.js';
import { Star } from './particles/Star.js';
import { Planet } from './particles/Planet.js';
import { DarkParticle } from './particles/DarkParticle.js';
import { Field } from './Field.js';
import { Box } from './Box.js';
import { rand } from './utils.js';

const animationDelay = 10;
const INITIAL_SCALE = 0.1;
let SCALE_STEP = 0.01;
const dt = 0.1;

let scaleFactorElem = null;
let scaleFactorInp = null;
let countElem = null;
let perfElem = null;
let perfValue = 0;
let xRotationText = null;
let yRotationText = null;
let zRotationText = null;
let toggleRunBtn = null;
let paused = true;
let updating = false;
let rotating = false;
const autoStart = false;
const rotation = { alpha: 0, beta: 0, gamma: 0 };
let field = null;

function render() {
    const sfText = field.scaleFactor.toFixed(3);
    const sfValue = parseFloat(sfText);

    scaleFactorElem.textContent = sfText;
    scaleFactorInp.value = sfValue;
    countElem.textContent = field.particles.length;
    perfElem.textContent = perfValue;

    toggleRunBtn.textContent = (paused) ? 'Run' : 'Pause';

    xRotationText.textContent = rotation.alpha.toFixed(2);
    yRotationText.textContent = rotation.beta.toFixed(2);
    zRotationText.textContent = rotation.gamma.toFixed(2);
}

function update() {
    if (rotating || paused) {
        return;
    }

    updating = true;

    const pBefore = performance.now();

    field.calculate();
    field.drawFrame();
    if (SCALE_STEP !== 0) {
        field.setScaleFactor(field.scaleFactor + SCALE_STEP);
    }

    perfValue = Math.round(performance.now() - pBefore);

    render();

    if (!paused) {
        setTimeout(update, animationDelay);
    }

    updating = false;
}

function initStars() {
    const PARTICLES_COUNT = 2000;

    field.setScaleFactor(0.1);
    field.setTimeStep(0.1);
    field.useCollide = false;
    field.useSoftening = false;
    SCALE_STEP = 0.01;

    for (let i = 0; i < PARTICLES_COUNT; i += 1) {
        const chance = rand();
        const xPos = rand(-field.center.x, field.center.x);
        const yPos = rand(-field.center.y, field.center.y);
        const zPos = rand(-field.center.z, field.center.z);

        let particle;

        if (chance > 0.9) {
            particle = new Star(xPos, yPos, zPos, 1000000000);
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

function initGalaxies() {
    const G_SIZE_LEFT = 150;
    const G_SIZE_RIGHT = 80;

    field.setScaleFactor(4);
    field.setTimeStep(0.1);
    field.useCollide = false;
    SCALE_STEP = 0.01;

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

        particle.velocity.x = rand() * 2;

        field.push(particle);
    }

    for (let i = 0; i < 500; i += 1) {
        const chance = rand();
        const dist = rand() * G_SIZE_RIGHT;
        const a = rand() * Math.PI * 2;
        const xPos = Math.round(rightPos.x + dist * Math.cos(a));
        const yPos = Math.round(rightPos.y + dist * Math.sin(a));
        const zPos = Math.round(rightPos.z + rand() * 10);

        let particle;

        if (chance > 0.5) {
            particle = new Star(xPos, yPos, zPos, 1000000000);
        } else {
            particle = new DarkParticle(xPos, yPos, zPos);
        }

        particle.velocity.x = -rand() * 2;

        field.push(particle);
    }
}

function initPlanetarySystem() {
    const AU = 150;
    const EM = 5.9;
    const V_SCALE = 1;

    field.setScaleFactor(2);
    field.setTimeStep(0.1);
    SCALE_STEP = 0;

    field.push(new Star(field.width / 2, field.height / 2, field.depth / 2, 1.9 * 10000000));

    let planet;
    planet = new Planet(field.width / 2 + AU * 0.38, field.height / 2, field.depth / 2, EM * 0.382);
    planet.velocity.y = 0.4 * V_SCALE;
    field.push(planet);

    planet = new Planet(field.width / 2 + AU * 0.72, field.height / 2, field.depth / 2, EM * 0.815);
    planet.velocity.y = 0.3 * V_SCALE;
    field.push(planet);

    planet = new Planet(field.width / 2 + AU, field.height / 2, field.depth / 2, EM);
    planet.velocity.y = 0.3 * V_SCALE;
    field.push(planet);

    planet = new Planet(field.width / 2 + AU * 1.52, field.height / 2, field.depth / 2, EM * 0.107);
    planet.velocity.y = 0.2 * V_SCALE;
    field.push(planet);

    planet = new Planet(field.width / 2 + AU * 5.2, field.height / 2, field.depth / 2, EM * 318);
    planet.velocity.y = 0.1 * V_SCALE;
    field.push(planet);
}

function initGas() {
    const PARTICLES_COUNT = 2000;

    field.setScaleFactor(0.01);
    field.setTimeStep(0.1);
    SCALE_STEP = 0.001;

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

function initParticles() {
    const PARTICLES_COUNT = 50;

    field.setScaleFactor(0.0001);
    field.setTimeStep(0.1);
    field.addInstantly = true;
    SCALE_STEP = 0;

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

function initVelocityTest() {
    field.setScaleFactor(0.1);
    field.setTimeStep(0.01);
    field.drawPaths = true;
    field.useCollide = false;
    SCALE_STEP = 0;

    field.push(new Star(0, 0, 0, 100000000000));

    field.push(new Star(-field.width / 2 + 10, -field.height / 2 + 10, 0, 1000));
    field.push(new Star(-field.width / 2 + 10, -field.height / 2 + 100, 100, 10000));
    field.push(new Star(-field.width / 2 + 10, -field.height / 2 + 200, 200, 100000));
    field.push(new Star(-field.width / 2 + 10, -field.height / 2 + 300, 300, 1000000));
}

function initDepthTest() {
    const D = 1;

    field.push(new Star(D, D, D));
    field.push(new Star(field.width - D, D, D));
    field.push(new Star(D, field.height - D, D));
    field.push(new Star(D, D, field.depth - D));
    field.push(new Star(D, field.height - D, field.depth - D));
    field.push(new Star(field.width - D, D, field.depth - D));
    field.push(new Star(field.width - D, field.height - D, D));
    field.push(new Star(field.width - D, field.height - D, field.depth - D));
}

function drawMaxVelocity() {
    const frame = field.context2d.createImageData(field.width, field.height);
    const yF = (y) => field.height - y;

    const MAX_SPEED = 300;
    const scaleFactor = 3;
    const c = MAX_SPEED / scaleFactor;
    const relVelocity = (velocity) => c * Math.tanh(velocity / c);

    for (let x = 0; x < 1000; x += 1) {
        const v = x;
        field.putPixel(frame, x, yF(v), 128, 255, 128, 255);
        field.putPixel(frame, x, yF(c), 128, 255, 128, 255);
        const y = relVelocity(v);
        field.putPixel(frame, x, yF(y), 255, 128, 80, 255);
    }

    field.context2d.putImageData(frame, 0, 0);
}

function draw3D(canvas) {
    const DIST = 1000; /* Distance from camera to canvas */
    const Z_SHIFT = 0; /* Distance from canvas to z=0 plane */
    const HH = canvas.height / 2;
    const HW = canvas.width / 2;

    const yF = (v) => HH - (DIST * (HH - v.y)) / (DIST + v.z + Z_SHIFT);
    const xF = (v) => HW - (DIST * (HW - v.x)) / (DIST + v.z + Z_SHIFT);

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

        cube.draw(frame, cubeCenter, xF, yF);

        canvas.drawFrame(frame);
    };

    const update3dFrame = () => {
        cube.rotate(0, 0.1, 0);
        draw3dFrame();
        setTimeout(() => update3dFrame(), 100);
    };

    draw3dFrame();
    setTimeout(() => update3dFrame(), 100);
}

function pause() {
    if (paused) {
        return;
    }

    paused = true;
    render();
}

function run() {
    if (!paused) {
        return;
    }

    paused = false;
    render();
    setTimeout(update, 10);
}

function onScale(e) {
    const val = parseFloat(e.target.value);

    field.setScaleFactor(val);
    render();
}

function processRotation(a, b, g, pb) {
    rotating = true;

    if (updating) {
        setTimeout(() => processRotation(a, b, g, pb), 10);
    }

    field.rotate(a, b, g);
    field.drawFrame();

    if (pb) {
        render();
    } else {
        run();
    }

    rotating = false;
}

function onXRotate(e) {
    const pausedBefore = paused;
    pause();

    const val = parseFloat(e.target.value);
    const delta = val - rotation.alpha;
    rotation.alpha = val;

    processRotation(delta, 0, 0, pausedBefore);
}

function onYRotate(e) {
    const pausedBefore = paused;
    pause();

    const val = parseFloat(e.target.value);
    const delta = val - rotation.beta;
    rotation.beta = val;

    processRotation(0, delta, 0, pausedBefore);
}

function onZRotate(e) {
    const pausedBefore = paused;
    pause();

    const val = parseFloat(e.target.value);
    const delta = val - rotation.gamma;
    rotation.gamma = val;

    processRotation(0, 0, delta, pausedBefore);
}

function onToggleRun() {
    if (paused) {
        run();
    } else {
        pause();
    }
}

function init() {
    const canvas = new Canvas(document.getElementById('cnv'));

    scaleFactorInp = document.getElementById('scaleFactorInp');
    scaleFactorInp.addEventListener('input', onScale);
    scaleFactorElem = document.getElementById('scalefactor');

    countElem = document.getElementById('particlescount');
    perfElem = document.getElementById('perfvalue');

    const xRotationInp = document.getElementById('xRotationInp');
    xRotationInp.addEventListener('input', onXRotate);
    xRotationText = document.getElementById('xrotate');

    const yRotationInp = document.getElementById('yRotationInp');
    yRotationInp.addEventListener('input', onYRotate);
    yRotationText = document.getElementById('yrotate');

    const zRotationInp = document.getElementById('zRotationInp');
    zRotationInp.addEventListener('input', onZRotate);
    zRotationText = document.getElementById('zrotate');

    toggleRunBtn = document.getElementById('toggleRunBtn');
    toggleRunBtn.addEventListener('click', onToggleRun);

    const canvasDemos = {
        maxVelocity: drawMaxVelocity,
        cube: draw3D,
    };

    const fieldDemos = {
        planetarySystem: initPlanetarySystem,
        stars: initStars,
        galaxies: initGalaxies,
        gas: initGas,
        particles: initParticles,
        velocityTest: initVelocityTest,
        depthTest: initDepthTest,
    };

    const demoType = 'field';
    const runCanvasDemo = 'cube';
    const runFieldDemo = 'particles';

    if (demoType === 'canvas') {
        const demo = canvasDemos[runCanvasDemo];
        demo(canvas);
    } else if (demoType === 'field') {
        field = new Field(canvas, INITIAL_SCALE, dt);

        const demoInit = fieldDemos[runFieldDemo];
        demoInit();

        field.drawFrame();

        render();

        if (autoStart) {
            run();
        }
    }
}

document.addEventListener('DOMContentLoaded', init);