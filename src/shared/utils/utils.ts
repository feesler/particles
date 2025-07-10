import { asArray } from '@jezvejs/types';
import React from 'react';

import { Axis3D } from 'engine/types.ts';
import { Vector } from 'engine/Vector/Vector.ts';
import {
    IdObject,
    IncludeGroupItemsParam,
    MenuItemCallback,
    MenuLoopParam,
    Point,
    ToFlatListParam,
} from 'shared/types.ts';

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

/**
 * Returns coordinates of top left and bottom right corners of rectangle bounding specified points
 * @param {Point[]} points
 * @returns {[Point, Point] | null}
 */
function getPointsBoundingRect(points: Point[]): [Point, Point] | null {
    if (points.length < 2) {
        return null;
    }

    const [first] = points;
    const topLeft = { ...first };
    const bottomRight = { ...first };

    for (let i = 1; i < points.length; i++) {
        const { x, y } = points[i];

        topLeft.x = Math.min(x, topLeft.x);
        topLeft.y = Math.min(y, topLeft.y);

        bottomRight.x = Math.max(x, bottomRight.x);
        bottomRight.y = Math.max(y, bottomRight.y);
    }

    return [topLeft, bottomRight];
}

/**
 * Returns distance between two points
 * @param {Point[]} points
 * @returns {number}
 */
export function getPointsDistance(points: Point[]): number {
    const rect = getPointsBoundingRect(points);
    if (!rect) {
        return 0;
    }

    const [topLeft, bottomRight] = rect;
    const width = topLeft.x - bottomRight.x;
    const height = topLeft.y - bottomRight.y;
    return Math.sqrt(width * width + height * height);
}

/**
 * Returns the point midway between specified points or null if input is invalid
 * @param {Point[]} points
 * @returns {Point|null}
 */
export function getMiddlePoint(points: Point[]): Point | null {
    const rect = getPointsBoundingRect(points);
    if (!rect) {
        return null;
    }

    const [topLeft, bottomRight] = rect;
    return {
        x: (topLeft.x + bottomRight.x) / 2,
        y: (topLeft.y + bottomRight.y) / 2,
    };
}

/**
 * Returns the anlge between two specified points or null if input is invalid
 * @param {Point[]} points
 * @returns {number|null}
 */
export function getAngleBetweenPoints(points: Point[]): number | null {
    const [p1, p2] = points;
    if (!p1 || !p2) {
        return null;
    }

    const width = p2.x - p1.x;
    const height = p2.y - p1.y;
    return Math.atan2(height, width);
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
            const groupItem = shouldIncludeParentItem(item, options as IncludeGroupItemsParam)
                ? callback(item, index, items)
                : item;

            res.push({
                ...groupItem,
                items: mapItems<T, R>(
                    ('items' in item) ? asArray(item.items) : [],
                    callback,
                    {
                        ...(options ?? {}),
                        group: groupItem as T,
                    },
                ),
            } as R);
        } else {
            res.push(callback(item, index, items));
        }
    }

    return res;
}
