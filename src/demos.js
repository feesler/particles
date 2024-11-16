import { initStars } from './demos/stars.js';
import { initGalaxies } from './demos/galaxies.js';
import { initPlanetarySystem } from './demos/planetary.js';
import { initGas } from './demos/gas.js';
import { initParticles } from './demos/particles.js';
import { initVelocityTest } from './demos/velocity.js';
import { MaxVelocityDemo } from './demos/canvas/maxVelocity.js';
import { Box3dDemo } from './demos/canvas/box3d.js';

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

/**
 * Searches for first tree item for which callback function return true
 *
 * @param {SortableTreeItem[]} items array of items to search in
 * @param {Function} callback function to
 */
export function findTreeItem(items, callback) {
    if (!Array.isArray(items)) {
        throw new Error('Invalid items parameter');
    }
    if (typeof callback !== 'function') {
        throw new Error('Invalid callback parameter');
    }

    for (let index = 0; index < items.length; index += 1) {
        const item = items[index];
        if (callback(item, index, items)) {
            return item;
        }

        if (Array.isArray(item?.items)) {
            const childRes = findTreeItem(item.items, callback);
            if (childRes) {
                return childRes;
            }
        }
    }

    return null;
}

export const findDemoById = (id) => (
    findTreeItem(demos, (item) => item?.id === id)
);
