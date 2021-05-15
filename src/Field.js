import { Particle } from './Particle.js';

const K = 8.9 * 10;
const G = 6.67 * 0.00001;
const MAX_SPEED = 200;
const dt = 0.01;

export class Field {
    constructor(canvasElem, scaleFactor) {
        if (!canvasElem) {
            throw new Error('Invalid canvas');
        }

        this.canvas = canvasElem;
        this.context2d = this.canvas.getContext('2d');
        this.height = parseInt(this.canvas.getAttribute('height'));
        this.width = parseInt(this.canvas.getAttribute('width'));

        this.particles = [];
        this.scaleFactor = scaleFactor;
    }

    drawFrameByCircles() {
        this.context2d.clearRect(0, 0, this.width, this.height);
        this.context2d.fillStyle = 'white';
        this.context2d.strokeStyle = 'white';
        this.context2d.lineWidth = 0.5;

        for (const particle of this.particles) {
            this.context2d.beginPath();
            this.context2d.arc(particle.x, particle.y, 0.5, 0, Math.PI * 2, true);
            this.context2d.stroke();
        }
    }

    putPixel(frame, x, y, r, g, b, a) {
        const rx = Math.round(x);
        const ry = Math.round(y);
        let ind = ry * (this.width * 4) + rx * 4;

        frame.data[ind] = r;
        frame.data[ind + 1] = g;
        frame.data[ind + 2] = b;
        frame.data[ind + 3] = a;
    }

    drawFrameByPixels() {
        const frame = this.context2d.createImageData(this.width, this.height);

        for (const particle of this.particles) {
            this.putPixel(frame,
                particle.x,
                particle.y,
                particle.color.r,
                particle.color.g,
                particle.color.b,
                255,
            );
        }

        this.context2d.putImageData(frame, 0, 0);
    }

    drawFrame() {
        this.drawFrameByPixels();
    }

    /* Add particle */
    add(q) {
        if (!q instanceof Particle) {
            return;
        }

        this.particles.push(q);
    }

    /* Looped distance by x axis */
    dX(A, B) {
        return Math.abs(A.x - B.x) * this.scaleFactor;
    }

    /* Orientation by x axis */
    oX(A, B) {
        return (A.x < B.x) ? 1 : -1;
    }

    /* Distance by y axis */
    dY(A, B) {
        return Math.abs(A.y - B.y) * this.scaleFactor;
    }

    /* Orientation by y axis */
    oY(A, B) {
        return (A.y < B.y) ? 1 : -1;
    }

    async force(particle) {
        let res = { x: 0, y: 0 };

        for (let nq of this.particles) {
            if (nq == particle) {
                continue;
            }

            let dx = this.dX(particle, nq);
            let dy = this.dY(particle, nq);

            if (dx == 0) {
                dx = 0.0001;
            }
            if (dy == 0) {
                dy = 0.0001;
            }

            let d2 = dx * dx + dy * dy;
            let d = Math.sqrt(d2);
            let cosa = dx / d;
            let cosb = dy / d;

            const orientX = this.oX(particle, nq);
            const orientY = this.oY(particle, nq);
            cosa *= orientX;
            cosb *= orientY;

            if (isNaN(cosa) || isNaN(cosb)) {
                throw new Error('ffuuu');
            }

            let forceSign = 1;

            if (!particle.attract(nq)) {
                forceSign = -1;
            }

            let emForce = 0;
            emForce = K * forceSign * Math.abs(particle.charge * nq.charge) / d2;
            res.x += (emForce * cosa);
            res.y += (emForce * cosb);

            let gForce = 0;
            gForce = G * Math.abs(particle.m * nq.m) / d2;
            res.x += (gForce * cosa);
            res.y += (gForce * cosb);
        }

        return res;
    }

    relVelocity(velocity) {
        const c = MAX_SPEED / this.scaleFactor;
        return c * Math.tanh(velocity / c);
    }

    async applyForce(particle, force) {
        const q = particle;
        const f = force;

        let ax = f.x / q.m;
        let ay = f.y / q.m;
        if (Number.isNaN(ax) || Number.isNaN(ay)) {
            throw new Errro('Invalid values');
        }

        let dx = this.relVelocity(q.dx + ax * dt);
        let dy = this.relVelocity(q.dy + ay * dt);
        if (Number.isNaN(dx) || Number.isNaN(dy)) {
            throw new Errro('Invalid values');
        }

        let newx = q.x + dx;
        const loss = 0.1;

        if (newx < 0) {
            newx = -(q.x + dx);
            dx = -dx * loss;
        } else if (newx > this.width) {
            newx = this.width - (newx - this.width);
            dx = -dx * loss;
        }

        let newy = q.y + dy;
        if (newy < 0) {
            newy = -(q.y + dy);
            dy = -dy * loss;
        } else if (newy > this.height) {
            newy = this.height - (newy - this.height);
            dy = -dy * loss;
        }

        q.x = newx;
        q.y = newy;

        q.dx = dx;
        q.dy = dy;

        q.fx += f.x;
        q.fy += f.y;
    }

    async applyForces(forces) {
        const tasks = this.particles.map((particle, ind) =>
            this.applyForce(particle, forces[ind])
        );

        await Promise.all(tasks);
    }

    async calculate() {
        const tasks = this.particles.map(q => this.force(q));

        const forces = await Promise.all(tasks);

        await this.applyForces(forces);
    }
}
