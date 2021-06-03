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
