import { initStars } from './demos/stars.ts';
import { initGalaxies } from './demos/galaxies.ts';
import { initPlanetarySystem } from './demos/planetary.ts';
import { initGas } from './demos/gas.ts';
import { initParticles } from './demos/particles.ts';
import { initVelocityTest } from './demos/velocity.ts';
import { MaxVelocityDemo } from './demos/canvas/maxVelocity.ts';
import { Box3dDemo } from './demos/canvas/box3d.ts';

import { findDemoItem } from './utils.ts';
import { View } from './types.ts';

export type DemoItemFunc = (view: View) => void;

export type DemoProps = {
    useWebGL: boolean;
    useField: boolean;
};

export class DemoClass {
    getProps(): Partial<DemoProps> {
        return {
        };
    };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    init(_: View) {
    }

    clear?() {
    }
};

export type DemoItem = {
    id: string;
    type: 'field' | 'canvas' | 'group' | 'button';
    title?: string;
    init?: DemoItemFunc;
    demo?: typeof DemoClass;
    items?: DemoItem[];
};

export const demos: DemoItem[] = [
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
                demo: MaxVelocityDemo,
            },
            {
                id: 'cube',
                type: 'canvas',
                demo: Box3dDemo,
            },
        ],
    },
];

export const findDemoById = (id: string): DemoItem | null => (
    findDemoItem<DemoItem>(demos, (item: DemoItem) => item?.id === id)
);
