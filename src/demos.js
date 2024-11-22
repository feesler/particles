import { initStars } from './demos/stars.js';
import { initGalaxies } from './demos/galaxies.js';
import { initPlanetarySystem } from './demos/planetary.js';
import { initGas } from './demos/gas.js';
import { initParticles } from './demos/particles.js';
import { initVelocityTest } from './demos/velocity.js';
import { MaxVelocityDemo } from './demos/canvas/maxVelocity.js';
import { Box3dDemo } from './demos/canvas/box3d.js';

import { findMenuItem } from './utils.js';

export const demos = [
    {
        id: 'planetarySystem',
        type: 'field',
        init: initPlanetarySystem,
    },
    {
        id: 'stars',
        type: 'field',
        init: initStars,
    },
    {
        id: 'galaxies',
        type: 'field',
        init: initGalaxies,
    },
    {
        id: 'gas',
        type: 'field',
        init: initGas,
    },
    {
        id: 'particles',
        type: 'field',
        init: initParticles,
    },
    {
        id: 'velocityTest',
        type: 'field',
        init: initVelocityTest,
    },
    {
        id: 'canvasGroup',
        title: 'Canvas tests',
        type: 'group',
        items: [
            {
                id: 'maxVelocity',
                type: 'canvas',
                init: MaxVelocityDemo,
            },
            {
                id: 'cube',
                type: 'canvas',
                init: Box3dDemo,
            },
        ],
    },
];

export const findDemoById = (id) => (
    findMenuItem(demos, (item) => item?.id === id)
);
