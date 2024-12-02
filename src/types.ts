import { Canvas2D } from './Canvas2D.ts';
import { CanvasWebGL } from './CanvasWebGL.ts';
import { DemoItem } from './demos.ts';
import { Field } from './engine/Field.ts';

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

export interface MenuItemCallback<T extends DemoItem = DemoItem, R = boolean> {
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
    T extends DemoItem = DemoItem,
> extends IncludeGroupItemsParam {
    group?: T | null;
}

export type Canvas = Canvas2D | CanvasWebGL;

export interface View {
    canvas: Canvas;
    field: Field | null;
    setScaleStep: (scaleStep: number) => void;
}
