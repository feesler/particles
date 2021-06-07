import { Vector } from './Vector.js';
import { Proton } from './particles/Proton.js';
import { Electron } from './particles/Electron.js';
import { Star } from './particles/Star.js';
import { Planet } from './particles/Planet.js';
import { DarkParticle } from './particles/DarkParticle.js';
import { Box } from './Box.js';
import { rand } from './utils.js';
import { MainView } from './MainView.js';

function initStars(view) {
    const PARTICLES_COUNT = 2000;
    const { field } = view;

    field.setScaleFactor(0.1);
    field.setTimeStep(0.1);
    field.useCollide = false;
    field.useSoftening = false;
    view.setScaleStep(0.01);

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

function initGalaxies(view) {
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

function initPlanetarySystem(view) {
    const AU = 150;
    const EM = 5.9;
    const V_SCALE = 1;
    const { field } = view;

    field.setScaleFactor(2);
    field.setTimeStep(0.1);
    view.setScaleStep(0);

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

function initGas(view) {
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

function initParticles(view) {
    const PARTICLES_COUNT = 50;
    const { field } = view;

    field.setScaleFactor(0.0001);
    field.setTimeStep(0.1);
    field.addInstantly = true;
    field.useSpontaneous = false;
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

function initVelocityTest(view) {
    const { field } = view;

    field.setScaleFactor(0.1);
    field.setTimeStep(0.01);
    field.drawPaths = true;
    field.useCollide = false;
    view.setScaleStep(0);

    field.push(new Star(0, 0, 0, 100000000000));

    field.push(new Star(-field.width / 2 + 10, -field.height / 2 + 10, 0, 1000));
    field.push(new Star(-field.width / 2 + 10, -field.height / 2 + 100, 100, 10000));
    field.push(new Star(-field.width / 2 + 10, -field.height / 2 + 200, 200, 100000));
    field.push(new Star(-field.width / 2 + 10, -field.height / 2 + 300, 300, 1000000));
}

function initDepthTest(view) {
    const { field } = view;
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

function drawMaxVelocity(view) {
    const frame = view.canvas.createFrame();
    const { height } = view.canvas;

    const yF = (y) => height - y;

    const MAX_SPEED = 300;
    const scaleFactor = 3;
    const c = MAX_SPEED / scaleFactor;
    const relVelocity = (velocity) => c * Math.tanh(velocity / c);

    for (let x = 0; x < 1000; x += 1) {
        const v = x;
        frame.putPixel(x, yF(v), 128, 255, 128, 255);
        frame.putPixel(x, yF(c), 128, 255, 128, 255);
        const y = relVelocity(v);
        frame.putPixel(x, yF(y), 255, 128, 80, 255);
    }

    view.canvas.drawFrame(frame);
}

function draw3D(view) {
    const { canvas } = view;

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

let demo;
if (demoType === 'canvas') {
    demo = canvasDemos[runCanvasDemo];
} else if (demoType === 'field') {
    demo = fieldDemos[runFieldDemo];
}

window.view = new MainView({
    demo,
});
