import { MenuItemProps, MenuItemType } from '@jezvejs/react';

import { Box3dDemo } from './canvas/box3d.ts';
import { MaxVelocityDemo } from './canvas/maxVelocity.ts';
import { initGalaxies } from './galaxies.ts';
import { initGas } from './gas.ts';
import { initParticles } from './particles.ts';
import { initPlanetarySystem } from './planetary.ts';
import { initStars } from './stars.ts';
import { initVelocityTest } from './velocity.ts';

import { View } from '../types.ts';
import { findDemoItem, mapItems } from '../utils.ts';

export type DemoItemFunc = (view: View) => void;

export type DemoProps = {
    useWebGL: boolean;
    useField: boolean;
};

export class DemoClass {
    getProps(): Partial<DemoProps> {
        return {
        };
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    init(_: View) {
    }

    clear?() {
    }
}

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
        title: 'Planetary system',
        init: initPlanetarySystem,
    },
    {
        id: 'stars',
        type: 'field',
        title: 'Stars',
        init: initStars,
    },
    {
        id: 'galaxies',
        type: 'field',
        title: 'Galaxy',
        init: initGalaxies,
    },
    {
        id: 'gas',
        type: 'field',
        title: 'Gas',
        init: initGas,
    },
    {
        id: 'particles',
        type: 'field',
        title: 'Particles',
        init: initParticles,
    },
    {
        id: 'velocityTest',
        type: 'field',
        title: 'Velocity test',
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
                title: 'Maximum velocity test',
                demo: MaxVelocityDemo,
            },
            {
                id: 'cube',
                type: 'canvas',
                title: 'Cube',
                demo: Box3dDemo,
            },
        ],
    },
];

export const demosList = mapItems<DemoItem, MenuItemProps>(demos, (item) => ({
    id: item.id,
    title: item.title,
    type: ((item.type === 'group') ? 'group' : 'button') as MenuItemType,
    items: item.items as MenuItemProps[],
}));

export const findDemoById = (id: string): DemoItem | null => (
    findDemoItem<DemoItem>(demos, (item: DemoItem) => item?.id === id)
);
