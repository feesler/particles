import { Vector } from './Vector.ts';

export interface Object3D<T = number> {
    x: T;
    y: T;
    z: T;
};

export type Axis3D = keyof Object3D;

export type Point3D = Object3D<number>;

export type Rotation = {
    alpha: number;
    beta: number;
    gamma: number;
};

export type ProjectionFunc = (vector: Vector) => Object3D<number>;
