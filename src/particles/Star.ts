import { Particle } from './Particle.ts';
import { RGBColor, STAR_TYPE } from './types.ts';

const clamp = (num: number, min: number, max: number) => (
    (num < min) ? min : ((num > max) ? max : num)
);

const temperatureToColor = (temperature: number): RGBColor => {
    const tK = clamp(temperature, 1000, 40000) / 100;

    return {
        r: (
            (tK <= 66)
                ? 255
                : clamp(329.698727446 * (Math.pow(tK - 60, -0.1332047592)), 0, 255)
        ),
        g: (
            (tK <= 66)
                ? clamp(99.4708025861 * Math.log(tK) - 161.1195681661, 0, 255)
                : clamp(288.1221695283 * (Math.pow(tK - 60, -0.0755148492)), 0, 255)
        ),
        b: (
            (tK >= 66)
                ? 255
                : (
                    (tK <= 19)
                        ? 0
                        : clamp(138.5177312231 * Math.log(tK - 10) - 305.0447927307, 0, 255)
                )
        ),
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
        const temp = Math.pow(mass, 0.5);

        return temperatureToColor(temp);
    }

    setMass(mass: number) {
        super.setMass(mass);

        this.color = this.getColor(mass);
    }
}
