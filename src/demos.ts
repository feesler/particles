import { initStars } from './demos/stars.ts';
import { initGalaxies } from './demos/galaxies.ts';
import { initPlanetarySystem } from './demos/planetary.ts';
import { initGas } from './demos/gas.ts';
import { initParticles } from './demos/particles.ts';
import { initVelocityTest } from './demos/velocity.ts';
import { MaxVelocityDemo } from './demos/canvas/maxVelocity.ts';
import { Box3dDemo } from './demos/canvas/box3d.ts';

import { findMenuItem } from './utils.ts';

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
