import { Vector } from '../Vector.js';
import { Star } from '../particles/Star.js';
import { DarkParticle } from '../particles/DarkParticle.js';
import { rand } from '../utils.js';

const randExpo = (max, lambda) => {
    const u = rand(0, max) / (max + 1);
    return -Math.log(1 - u) / lambda;
};


export function initGalaxies(view) {
    const G_SIZE_LEFT = 150;
    const G_STARS_COUNT = 1000;
    const { field } = view;

    field.setScaleFactor(4);
    field.setTimeStep(0.1);
    field.useCollide = false;
    field.useSoftening = false;
    view.setScaleStep(0);

    const leftPos = new Vector(0, 0, 0);
    const dist = new Vector();
    const pos = new Vector();

    let particle;
    let mass = 10000000000;

    particle = new Star(leftPos.x, leftPos.y, leftPos.z, mass);
    field.push(particle);

    for (let i = 0; i < G_STARS_COUNT; i += 1) {
        const chance = rand();
        const d = randExpo(G_SIZE_LEFT, 0.005);
        const a = rand(0, Math.PI * 2);

        dist.x = d * Math.cos(a);
        dist.y = randExpo(10, 0.05);
        dist.z = d * Math.sin(a);

        pos.set(dist);
        pos.add(leftPos);

        if (chance > 0.9) {
            mass = rand(100000000, 1000000000);
        } else if (chance > 0.5) {
            mass = rand(10000000, 100000000);
        } else {
            mass = rand(100000, 10000000);
        }
        particle = new Star(pos.x, pos.y, pos.z, mass);

        particle.velocity.set(dist);
        particle.velocity.normalize();

        const starMassDelta = d / Math.log(mass);
        const V_SCALE = 0.5;
        particle.velocity.rotateAroundY(starMassDelta + (3 * Math.PI / 2));
        particle.velocity.multiplyByScalar(starMassDelta * V_SCALE);

        field.push(particle);
        particle = new DarkParticle(pos.x, pos.y, pos.z);
        field.push(particle);
    }
}
