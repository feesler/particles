export const EPSILON = 0.00000001;
export const AXES = ['x', 'y', 'z'];

export function intersectPlane(planePoint, planeNormal, linePoint, lineVector) {
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
export function rand(from = 0, to = 1) {
    const mfrom = Math.min(from, to);
    const mto = Math.max(from, to);
    const d = Math.abs(mto - mfrom);
    if (d === 0) {
        return mfrom;
    }

    return Math.random() * d + mfrom;
}

export function getEventCoordinatesObject(e) {
    if ('touches' in e) {
        if (e.type === 'touchend' || e.type === 'touchcancel') {
            return e.changedTouches[0];
        }

        return e.touches[0];
    }

    return e;
}

export function getEventPageCoordinates(e) {
    const coords = getEventCoordinatesObject(e);

    return {
        x: coords.pageX,
        y: coords.pageY,
    };
}

export function getEventClientCoordinates(e) {
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
export function isChildItemsAvailable(item) {
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
export function shouldIncludeParentItem(item, options) {
    return !!(
        (item.type === 'group' && options?.includeGroupItems)
        || (item.type === 'parent' && options?.includeChildItems)
    );
}

/**
 * Searches for first tree item for which callback function return true
 *
 * @param {SortableTreeItem[]} items array of items to search in
 * @param {Function} callback function to
 */
export function findMenuItem(items, callback) {
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
            const childRes = findMenuItem(item.items, callback);
            if (childRes) {
                return childRes;
            }
        }
    }

    return null;
}

/**
 * Returns list of menu items transformed with callback function
 * @param {T} items menu items array
 * @param {MenuItemCallback} callback
 * @param {MenuLoopParam<T>} options
 * @returns {T}
 */
export function mapItems(items, callback, options = null) {
    if (typeof callback !== 'function') {
        throw new Error('Invalid callback parameter');
    }

    const res = [];

    for (let index = 0; index < items.length; index += 1) {
        const item = {
            ...items[index],
            group: options?.group?.id,
        };

        if (isChildItemsAvailable(item)) {
            const group = shouldIncludeParentItem(item, options)
                ? callback(item, index, items)
                : item;

            res.push({
                ...group,
                items: mapItems(
                    (item.items ?? []),
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
