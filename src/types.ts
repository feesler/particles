import { Canvas2DElement } from './components/Canvas2D/Canvas2D.ts';
import { CanvasWebGLElement } from './components/CanvasWebGL/CanvasWebGL.ts';
import { DemoClass, DemoItemFunc } from './demos.ts';
import { Field } from './engine/Field.ts';

export type IdObject = {
    id: string;
}

/**
 * Coordinates point
 */
export interface Point {
    x: number;
    y: number;
}

export type PlanePoint = {
    left: number;
    right: number;
};

export type Axis = "x" | "y" | "z";

export interface MenuItemCallback<T extends object = object, R = boolean> {
    (item: T, index?: number, arr?: T[]): R;
}

/**
 * shouldIncludeParentItem() function params
 */
export interface IncludeGroupItemsParam {
    includeGroupItems?: boolean;
    includeChildItems?: boolean;
}

/**
 * toFlatList() function params
 */
export interface ToFlatListParam extends IncludeGroupItemsParam {
    disabled?: boolean;
}

/**
 * forItems() function params
 */
export interface MenuLoopParam<
    T extends object = object,
> extends IncludeGroupItemsParam {
    group?: T | null;
}

export type Canvas = Canvas2DElement | CanvasWebGLElement;

export interface View {
    canvas: Canvas;
    field: Field | null;
    setScaleStep: (scaleStep: number) => void;
}

export interface AppState {
    autoStart: boolean;
    useField: boolean;
    useWebGL: boolean;

    animationDelay: number;

    width: number;
    height: number;

    initialScale: number;
    timeStep: number;
    scaleStep: number;
    scaleFactor: number;

    paused: boolean;
    pausedBefore: boolean;
    updating: boolean;
    rotating: boolean;

    rotation: { alpha: 0, beta: 0, gamma: 0; },
    zoom: number;
    gScale: number;
    kScale: number;

    timestamp: number;
    perfValue: number;
    depth: number;

    dragging: boolean;
    settingsVisible: boolean;

    startPoint: Point | null;
    prevPoint: Point | null;
    prevTouches: Point[] | null;

    demo: DemoClass | DemoItemFunc | null;
}
