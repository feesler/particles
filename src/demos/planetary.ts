import { Star } from '../particles/Star.ts';
import { Planet } from '../particles/Planet.ts';
import { View } from '../types.ts';

export function initPlanetarySystem(view: View) {
    const AU = 150;
    const EM = 5.9;
    const V_SCALE = 1;
    const { field } = view;
    if (!field) {
        return;
    }

    field.setScaleFactor(2);
    field.setTimeStep(0.1);
    view.setScaleStep(0);

    field.push(new Star(0, 0, 0, 1.9 * 10000000));

    let planet;
    planet = new Planet(AU * 0.38, 0, 0, EM * 0.382);
    planet.velocity.y = 0.4 * V_SCALE;
    field.push(planet);

    planet = new Planet(AU * 0.72, 0, 0, EM * 0.815);
    planet.velocity.y = 0.3 * V_SCALE;
    field.push(planet);

    planet = new Planet(AU, 0, 0, EM);
    planet.velocity.y = 0.3 * V_SCALE;
    field.push(planet);

    planet = new Planet(AU * 1.52, 0, 0, EM * 0.107);
    planet.velocity.y = 0.2 * V_SCALE;
    field.push(planet);

    planet = new Planet(AU * 5.2, 0, 0, EM * 318);
    planet.velocity.y = 0.1 * V_SCALE;
    field.push(planet);
}
