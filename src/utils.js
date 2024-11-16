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
