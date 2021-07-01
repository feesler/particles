import { MainView } from './MainView.js';
import { initStars } from './demos/stars.js';
import { initGalaxies } from './demos/galaxies.js';
import { initPlanetarySystem } from './demos/planetary.js';
import { initGas } from './demos/gas.js';
import { initParticles } from './demos/particles.js';
import { initVelocityTest } from './demos/velocity.js';
import { MaxVelocityDemo } from './demos/canvas/maxVelocity.js';
import { Box3dDemo } from './demos/canvas/box3d.js';

const canvasDemos = {
    maxVelocity: MaxVelocityDemo,
    cube: Box3dDemo,
};

const fieldDemos = {
    planetarySystem: initPlanetarySystem,
    stars: initStars,
    galaxies: initGalaxies,
    gas: initGas,
    particles: initParticles,
    velocityTest: initVelocityTest,
};

const demoType = 'field';
const runCanvasDemo = 'maxVelocity';
const runFieldDemo = 'galaxies';

let demo;
if (demoType === 'canvas') {
    const DemoClass = canvasDemos[runCanvasDemo];
    demo = new DemoClass();
} else if (demoType === 'field') {
    demo = fieldDemos[runFieldDemo];
}

window.view = new MainView({
    demo,
});
