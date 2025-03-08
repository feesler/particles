import React from 'react';
import { Axis3D } from './engine/types.ts';
import { Vector } from './engine/Vector.ts';
import {
    IdObject,
    IncludeGroupItemsParam,
    MenuItemCallback,
    MenuLoopParam,
    Point,
    ToFlatListParam,
} from './types.ts';

export const EPSILON = 0.00000001;
export const AXES: Axis3D[] = ['x', 'y', 'z'];

export function intersectPlane(
    planePoint: Vector,
    planeNormal: Vector,
    linePoint: Vector,
    lineVector: Vector,
) {
    const lineNormalized = lineVector.copy();
    const planeDot = planeNormal.dotProduct(lineNormalized);
    if (Math.abs(planeDot) < EPSILON) {
        return null;
    }

    const t = (planeNormal.dotProduct(planePoint) - planeNormal.dotProduct(linePoint)) / planeDot;
    const res = linePoint.copy();
    res.addScaled(lineNormalized, t);
    return res;
}

/** Returns random value in range [from, to) */
export function rand(from: number = 0, to: number = 1): number {
    const mfrom = Math.min(from, to);
    const mto = Math.max(from, to);
    const d = Math.abs(mto - mfrom);
    if (d === 0) {
        return mfrom;
    }

    return Math.random() * d + mfrom;
}

export function getEventTouches(e: React.TouchEvent) {
    const touches = (e.type === 'touchend' || e.type === 'touchcancel')
        ? e.changedTouches
        : e.touches;

    return Array.from(touches);
}

export function getEventCoordinatesObject(e: React.TouchEvent | React.MouseEvent) {
    if ('touches' in e) {
        const [touch] = getEventTouches(e);
        return touch;
    }

    return e;
}

export function getPageCoordinates(source: React.Touch | React.MouseEvent) {
    return {
        x: source.pageX,
        y: source.pageY,
    };
}

export function getClientCoordinates(source: React.Touch | React.MouseEvent) {
    return {
        x: source.clientX,
        y: source.clientY,
    };
}

export function getTouchPageCoordinates(e: React.TouchEvent) {
    const touches = getEventTouches(e);
    return touches.map(getPageCoordinates);
}

export function getTouchClientCoordinates(e: React.TouchEvent) {
    const touches = getEventTouches(e);
    return touches.map(getClientCoordinates);
}

export function getEventPageCoordinates(e: React.TouchEvent | React.MouseEvent): Point {
    const coords = getEventCoordinatesObject(e);
    return getPageCoordinates(coords);
}

export function getEventClientCoordinates(e: React.TouchEvent | React.MouseEvent): Point {
    const coords = getEventCoordinatesObject(e);
    return getClientCoordinates(coords);
}

export function getPointsDistance(points: Point[]) {
    const [a, b] = points;
    if (!a || !b) {
        return 0;
    }

    const width = a.x - b.x;
    const height = a.y - b.y;
    return Math.sqrt(width * width + height * height);
}

/**
 * Returns true if specified item support child items
 *
 * @param {DemoItem} item
 * @returns {boolean}
 */
export function isChildItemsAvailable<T extends object = object>(item: T): boolean {
    return ('type' in item && item.type === 'group');
}

/**
 * Returns true if specified item itself should be included to the tree data processing
 *
 * @param {T = DemoItem} item
 * @param {ToFlatListParam} options
 * @returns {boolean}
 */
export function shouldIncludeParentItem<T extends object = object>(
    item: T,
    options: ToFlatListParam,
): boolean {
    return !!(
        ('type' in item && item.type === 'group' && options?.includeGroupItems)
    );
}

/**
 * Searches for first menu item for which callback function return true
 *
 * @param {<T = DemoItem>[]} items array of items to search in
 * @param {MenuItemCallback<T>} callback
 * @param {ToFlatListParam} options
 */
export function findDemoItem<T extends object = object>(
    items: T[],
    callback: MenuItemCallback<T>,
    options?: ToFlatListParam,
): T | null {
    if (!Array.isArray(items)) {
        throw new Error('Invalid items parameter');
    }
    if (typeof callback !== 'function') {
        throw new Error('Invalid callback parameter');
    }

    for (let index = 0; index < items.length; index += 1) {
        let item: T | null = items[index];
        if (callback(item)) {
            return item;
        }

        if (isChildItemsAvailable(item) && ('items' in item) && Array.isArray(item.items)) {
            item = findDemoItem<T>((item.items ?? []) as T[], callback, options);
            if (item) {
                return item;
            }
        }
    }

    return null;
}

/**
 * Returns list of menu items transformed with callback function
 * @param {T[]} items menu items array
 * @param {MenuItemCallback<T, T>} callback
 * @param {MenuLoopParam<T>} options
 * @returns {T[]}
 */
export function mapItems<
    T extends object = object,
    R extends object = object
>(
    items: T[],
    callback: MenuItemCallback<T, R>,
    options: MenuLoopParam<T> | null = null,
): R[] {
    if (typeof callback !== 'function') {
        throw new Error('Invalid callback parameter');
    }

    const res: R[] = [];

    for (let index = 0; index < items.length; index += 1) {
        const group = (options?.group ?? {}) as IdObject;
        const item: T = {
            ...items[index],
            group: !!('id' in group) && group.id,
        };

        if (isChildItemsAvailable(item)) {
            const group = shouldIncludeParentItem(item, options as IncludeGroupItemsParam)
                ? callback(item, index, items)
                : item;

            res.push({
                ...group,
                items: mapItems<T, R>(
                    ('items' in item && item.items || []) as T[],
                    callback,
                    {
                        ...(options ?? {}),
                        group: group as T,
                    },
                ),
            } as R);
        } else {
            res.push(callback(item, index, items));
        }
    }

    return res;
}
