import { Particle } from './Particle.ts';
import { RGBColor, STAR_TYPE } from './types.ts';

const clamp = (num: number, min: number, max: number) => {
    if (num < min) {
        return min;
    }

    return (num > max) ? max : num;
};

const getRed = (tK: number) => (
    (tK <= 66)
        ? 255
        : clamp(329.698727446 * (tK - 60 ** -0.1332047592), 0, 255)
);

const getGreen = (tK: number) => (
    (tK <= 66)
        ? clamp(99.4708025861 * Math.log(tK) - 161.1195681661, 0, 255)
        : clamp(288.1221695283 * (tK - 60 ** -0.0755148492), 0, 255)
);

const getBlue = (tK: number) => {
    if (tK >= 66) {
        return 255;
    }

    return (
        (tK <= 19)
            ? 0
            : clamp(138.5177312231 * Math.log(tK - 10) - 305.0447927307, 0, 255)
    );
};

const temperatureToColor = (temperature: number): RGBColor => {
    const tK = clamp(temperature, 1000, 40000) / 100;

    return {
        r: getRed(tK),
        g: getGreen(tK),
        b: getBlue(tK),
    };
};

export class Star extends Particle {
    constructor(x: number, y: number, z: number, mass: number = 500000) {
        super(x, y, z, 0, mass);

        this.r = Math.log(mass) / 10;
        this.color = this.getColor(mass);
        this.type = STAR_TYPE;
        this.isQuantum = false;
    }

    getColor(mass: number) {
        const temp = mass ** 0.5;

        return temperatureToColor(temp);
    }

    setMass(mass: number) {
        super.setMass(mass);

        this.color = this.getColor(mass);
    }
}
