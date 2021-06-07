import { Star } from '../particles/Star.js';
import { Planet } from '../particles/Planet.js';

export function initPlanetarySystem(view) {
    const AU = 150;
    const EM = 5.9;
    const V_SCALE = 1;
    const { field } = view;

    field.setScaleFactor(2);
    field.setTimeStep(0.1);
    view.setScaleStep(0);

    field.push(new Star(field.width / 2, field.height / 2, field.depth / 2, 1.9 * 10000000));

    let planet;
    planet = new Planet(field.width / 2 + AU * 0.38, field.height / 2, field.depth / 2, EM * 0.382);
    planet.velocity.y = 0.4 * V_SCALE;
    field.push(planet);

    planet = new Planet(field.width / 2 + AU * 0.72, field.height / 2, field.depth / 2, EM * 0.815);
    planet.velocity.y = 0.3 * V_SCALE;
    field.push(planet);

    planet = new Planet(field.width / 2 + AU, field.height / 2, field.depth / 2, EM);
    planet.velocity.y = 0.3 * V_SCALE;
    field.push(planet);

    planet = new Planet(field.width / 2 + AU * 1.52, field.height / 2, field.depth / 2, EM * 0.107);
    planet.velocity.y = 0.2 * V_SCALE;
    field.push(planet);

    planet = new Planet(field.width / 2 + AU * 5.2, field.height / 2, field.depth / 2, EM * 318);
    planet.velocity.y = 0.1 * V_SCALE;
    field.push(planet);
}
