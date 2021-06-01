
export const EPSILON = 0.00000001;

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
