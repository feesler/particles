import { Canvas } from './Canvas.js';
import { Vector } from './Vector.js';
import { Proton } from './particles/Proton.js';
import { Electron } from './particles/Electron.js';
import { Star } from './particles/Star.js';
import { Planet } from './particles/Planet.js';
import { DarkParticle } from './particles/DarkParticle.js';
import { Molecule } from './particles/Molecule.js';
import { Field } from './Field.js';
import { Box } from './Box.js';

const animationDelay = 10;
const INITIAL_SCALE = 0.1;
let SCALE_STEP = 0.01;
const dt = 0.1;

let scaleFactorElem = null;
let countElem = null;
let perfElem = null;
let xRotationText = null;
let yRotationText = null;
let zRotationText = null;
let toggleRunBtn = null;
let paused = true;
let updating = false;
let rotating = false;
const autoStart = false;
let rotation = { alpha: 0, beta: 0, gamma: 0 };
let field = null;

const rand = (from = 0, to = 1) => {
    const mfrom = Math.min(from, to);
    const mto = Math.max(from, to);
    const d = Math.abs(mto - mfrom);
    if (d === 0) {
        return mfrom;
    }

    return Math.random() * d + mfrom;
};

async function update() {
    if (rotating || paused) {
        return;
    }

    updating = true;

    const pBefore = performance.now();

    await field.calculate();
    field.drawFrame();
    field.setScaleFactor(field.scaleFactor + SCALE_STEP);

    const pAfter = performance.now();

    scaleFactorElem.textContent = field.scaleFactor.toFixed(3);
    countElem.textContent = field.particles.length;
    perfElem.textContent = Math.round(pAfter - pBefore);

    if (!paused) {
        setTimeout(update, animationDelay);
    }

    updating = false;
}

function initStars(f) {
    f.setScaleFactor(0.1);
    f.setTimeStep(0.1);
    f.useCollide = false;
    SCALE_STEP = 0.01;

    for (let i = 0; i < 1500; i++) {
        const chance = rand();
        const xPos = rand(-f.center.x, f.center.x);
        const yPos = rand(-f.center.y, f.center.y);
        const zPos = rand(-f.center.z, f.center.z);

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

        f.add(particle);
    }
}

function initGalaxies(f) {
    f.setScaleFactor(4);
    f.setTimeStep(0.1);
    f.useCollide = false;
    SCALE_STEP = 0.01;

    const G_SIZE_LEFT = 150;
    const G_SIZE_RIGHT = 80;

    const leftPos = new Vector(-f.width / 4, 0, 0);
    const rightPos = new Vector(f.width / 4, 0, 0);

    for (let i = 0; i < 1000; i++) {
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

        f.add(particle);
    }

    for (let i = 0; i < 500; i++) {
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

        f.add(particle);
    }

}

function initPlanetarySystem(f) {
    f.setScaleFactor(2);
    f.setTimeStep(0.1);
    SCALE_STEP = 0;

    f.add(new Star(f.width / 2, f.height / 2, f.depth / 2, 1.9 * 10000000));

    let xPos, yPos, zPos;
    let planet;
    let mass;

    const AU = 150;
    const EM = 5.9;
    const V_SCALE = 1;


    planet = new Planet(f.width / 2 + AU * 0.38, f.height / 2, f.depth / 2, EM * 0.382);
    planet.velocity.y = 0.4 * V_SCALE;
    f.add(planet);

    planet = new Planet(f.width / 2 + AU * 0.72, f.height / 2, f.depth / 2, EM * 0.815);
    planet.velocity.y = 0.3 * V_SCALE;
    f.add(planet);

    planet = new Planet(f.width / 2 + AU, f.height / 2, f.depth / 2, EM);
    planet.velocity.y = 0.3 * V_SCALE;
    f.add(planet);

    planet = new Planet(f.width / 2 + AU * 1.52, f.height / 2, f.depth / 2, EM * 0.107);
    planet.velocity.y = 0.2 * V_SCALE;
    f.add(planet);

    planet = new Planet(f.width / 2 + AU * 5.2, f.height / 2, f.depth / 2, EM * 318);
    planet.velocity.y = 0.1 * V_SCALE;
    f.add(planet);


}

function initGas(f) {
    f.setScaleFactor(0.01);
    f.setTimeStep(0.1);
    SCALE_STEP = 0.001;

    const T = 2;

    for (let i = 0; i < 1000; i++) {
        const chance = rand();

        const xPos = rand(-f.center.x, f.center.x);
        const yPos = rand(-f.center.y, f.center.y);
        const zPos = rand(-f.center.z, f.center.z);

        let particle;

        if (chance > 0.7) {
            particle = new Planet(xPos, yPos, zPos, 10000);
        } else {
            particle = new DarkParticle(xPos, yPos, zPos);
        }

        f.add(particle);
    }
}

function initParticles(f) {
    f.setScaleFactor(0.1);
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
    f.setScaleFactor(0.1);
    f.setTimeStep(0.01);
    f.drawPaths = true;
    f.useCollide = false;
    SCALE_STEP = 0;

    f.add(new Star(0, 0, 0, 100000000000));

    f.add(new Star(-f.width / 2 + 10, -f.height / 2 + 10, 0, 1000));
    f.add(new Star(-f.width / 2 + 10, -f.height / 2 + 100, 100, 10000));
    f.add(new Star(-f.width / 2 + 10, -f.height / 2 + 200, 200, 100000));
    f.add(new Star(-f.width / 2 + 10, -f.height / 2 + 300, 300, 1000000));
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

function createCube(width, height, depth) {
    const hw = width / 2;
    const hh = height / 2;
    const hd = depth / 2;

    return {
        vertices: [
            new Vector(-hw, hh, -hd),
            new Vector(hw, hh, -hd),
            new Vector(hw, hh, hd),
            new Vector(-hw, hh, hd),
            new Vector(-hw, -hh, -hd),
            new Vector(hw, -hh, -hd),
            new Vector(hw, -hh, hd),
            new Vector(-hw, -hh, hd),
        ],
        edges: [
            [0, 1],
            [1, 2],
            [2, 3],
            [3, 0],
            [0, 4],
            [1, 5],
            [2, 6],
            [3, 7],
            [4, 5],
            [5, 6],
            [6, 7],
            [7, 4],
        ],
    };
}

function draw3D(canvas) {
    let ALPHA = 0.1;//-Math.PI / 8;
    let BETA = 0;//Math.PI / 8;
    let GAMMA = 0;

    const DIST = 1000;       /* Distance from camera to canvas */
    const Z_SHIFT = 0;    /* Distance from canvas to z=0 plane */
    const HH = canvas.height / 2;
    const HW = canvas.width / 2;

    const yF = (v) => HH - DIST * (HH - v.y) / (DIST + v.z + Z_SHIFT);
    const xF = (v) => HW - DIST * (HW - v.x) / (DIST + v.z + Z_SHIFT);

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
        //ALPHA += 0.1;
        BETA += 0.1;
        cube.rotate(0, 0.1, 0);
        draw3dFrame();
        setTimeout(() => update3dFrame(), 100);
    };

    draw3dFrame();
    setTimeout(() => update3dFrame(), 100);
}

function render() {
    toggleRunBtn.textContent = (paused) ? 'Run' : 'Pause';

    xRotationText.textContent = rotation.alpha.toFixed(2);
    yRotationText.textContent = rotation.beta.toFixed(2);
    zRotationText.textContent = rotation.gamma.toFixed(2);
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

function onToggleRun() {
    if (paused) {
        run();
    } else {
        pause();
    }
}

function init() {
    const canvas = new Canvas(document.getElementById('cnv'));

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

    if (0) {
        //drawMaxVelocity(f);
        draw3D(canvas);
    } else {
        field = new Field(canvas, INITIAL_SCALE, dt);
        //initPlanetarySystem(field);
        //initStars(field);
        //initGalaxies(field);
        initGas(field);
        //initParticles(field);
        //initVelocityTest(field);
        //initDepthTest(field);

        field.drawFrame();

        render();

        if (autoStart) {
            run();
        }
    }

}

document.addEventListener('DOMContentLoaded', init);