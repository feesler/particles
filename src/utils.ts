import { Vector } from './engine/Vector.ts';
import {
    Axis,
    IncludeGroupItemsParam,
    MenuItemCallback,
    MenuItemProps,
    MenuLoopParam,
    Point,
    ToFlatListParam,
} from './types.ts';

export const EPSILON = 0.00000001;
export const AXES: Axis[] = ['x', 'y', 'z'];

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

export function getEventCoordinatesObject(e: TouchEvent | MouseEvent) {
    if ('touches' in e) {
        if (e.type === 'touchend' || e.type === 'touchcancel') {
            return e.changedTouches[0];
        }

        return e.touches[0];
    }

    return e;
}

export function getEventPageCoordinates(e: TouchEvent | MouseEvent): Point {
    const coords = getEventCoordinatesObject(e);

    return {
        x: coords.pageX,
        y: coords.pageY,
    };
}

export function getEventClientCoordinates(e: TouchEvent | MouseEvent): Point {
    const coords = getEventCoordinatesObject(e);

    return {
        x: coords.clientX,
        y: coords.clientY,
    };
}

/**
 * Returns true if specified item support child items
 *
 * @param {T = MenuItemProps} item
 * @returns {boolean}
 */
export function isChildItemsAvailable<T extends MenuItemProps = MenuItemProps>(item: T): boolean {
    return (
        item.type === 'group'
        || item.type === 'parent'
    );
}

/**
 * Returns true if specified item itself should be included to the tree data processing
 *
 * @param {T = MenuItemProps} item
 * @param {ToFlatListParam} options
 * @returns {boolean}
 */
export function shouldIncludeParentItem<T extends MenuItemProps = MenuItemProps>(
    item: T,
    options: ToFlatListParam,
): boolean {
    return !!(
        (item.type === 'group' && options?.includeGroupItems)
        || (item.type === 'parent' && options?.includeChildItems)
    );
}

/**
 * Searches for first menu item for which callback function return true
 *
 * @param {<T = MenuItemProps>[]} items array of items to search in
 * @param {MenuItemCallback<T>} callback
 * @param {ToFlatListParam} options
 */
export function findMenuItem<T extends MenuItemProps = MenuItemProps>(
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

        if (isChildItemsAvailable(item) && Array.isArray(item.items)) {
            item = findMenuItem<T>((item.items ?? []) as T[], callback, options);
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
export function mapItems<T extends MenuItemProps = MenuItemProps>(
    items: T[],
    callback: MenuItemCallback<T, T>,
    options: MenuLoopParam<T> | null = null,
): T[] {
    if (typeof callback !== 'function') {
        throw new Error('Invalid callback parameter');
    }

    const res: T[] = [];

    for (let index = 0; index < items.length; index += 1) {
        const item: T = {
            ...items[index],
            group: options?.group?.id,
        };

        if (isChildItemsAvailable(item)) {
            const group = shouldIncludeParentItem(item, options as IncludeGroupItemsParam)
                ? callback(item, index, items)
                : item;

            res.push({
                ...group,
                items: mapItems<T>(
                    (item.items ?? []) as T[],
                    callback,
                    {
                        ...(options ?? {}),
                        group,
                    },
                ),
            });
        } else {
            res.push(callback(item, index, items));
        }
    }

    return res;
}
