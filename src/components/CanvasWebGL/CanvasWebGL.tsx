import { useStore } from '@jezvejs/react';
import React, {
    forwardRef,
    useEffect,
    useImperativeHandle,
    useRef,
} from 'react';

import { Vector } from 'src/engine/Vector/Vector.ts';
import { RGBColor } from 'src/particles/types.ts';
import { AppState } from 'src/types.ts';
import * as m4 from '../../engine/Matrix4.ts';

export type CanvasWebGLElement = {
    elem: HTMLCanvasElement | null;

    setMatrix: (
        scene: number[],
        translation: number[],
        rotation: number[],
        scale: number[],
    ) => void;

    drawScene: () => void;

    clear: () => void;

    drawCircle: (x: number, y: number, _: number, color: RGBColor) => void;

    drawPoint: (pos: Vector, color: RGBColor) => void;

    drawLine: (start: Vector, end: Vector, color: RGBColor) => void;
};

export type CanvasWebGLRef = CanvasWebGLElement | null;

export type CanvasWebGLProps = React.HTMLAttributes<HTMLCanvasElement>;

const vertexShaderSrc = `
    attribute vec4 a_position;
    attribute vec3 a_color;
    varying vec3 v_color;
    uniform mat4 u_matrix;

    void main() {
        gl_Position = u_matrix * a_position;
        gl_PointSize = 1.0;

        v_color = a_color;
    }
`;

const fragmentShaderSrc = `
    precision mediump float;
    varying vec3 v_color;

    void main() {
        gl_FragColor = vec4(v_color, 1.0);
    }
`;

export const CanvasWebGL = forwardRef<
    CanvasWebGLRef,
    CanvasWebGLProps
>((props, ref) => {
    const { getState } = useStore<AppState>();

    const contextRef = useRef<WebGLRenderingContext | null>(null);
    const widthRef = useRef<number | null>(null);
    const heightRef = useRef<number | null>(null);

    const programRef = useRef<WebGLProgram | null>(null);
    const vertexShaderRef = useRef<WebGLShader | null>(null);
    const fragmentShaderRef = useRef<WebGLShader | null>(null);
    const matrixRef = useRef<number[]>([]);

    const positionBufferRef = useRef<WebGLBuffer | null>(null);
    const colorBufferRef = useRef<WebGLBuffer | null>(null);
    const positionsRef = useRef<number[]>([]);
    const colorsRef = useRef<number[]>([]);

    const positionAttributeLocation = useRef<number>(0);
    const matrixUniformLocation = useRef<WebGLUniformLocation | null>(0);
    const colorAttributeLocation = useRef<number>(0);

    const innerRef = useRef<HTMLCanvasElement | null>(null);

    const createShader = (type: number, source: string): WebGLShader | null => {
        const context = contextRef.current;
        if (!context) {
            return null;
        }

        const shader = context.createShader(type);
        if (!shader) {
            return null;
        }

        context.shaderSource(shader, source);
        context.compileShader(shader);
        const success = context.getShaderParameter(shader, context.COMPILE_STATUS);
        if (success) {
            return shader;
        }

        /* eslint-disable-next-line no-console */
        console.log(context.getShaderInfoLog(shader));
        context.deleteShader(shader);

        return null;
    };

    const createProgram = (vertexShader: WebGLShader, fragmentShader: WebGLShader) => {
        const context = contextRef.current;
        if (!context) {
            return null;
        }

        const program = context.createProgram();
        if (!program) {
            return null;
        }

        context.attachShader(program, vertexShader);
        context.attachShader(program, fragmentShader);
        context.linkProgram(program);
        const success = context.getProgramParameter(program, context.LINK_STATUS);
        if (success) {
            return program;
        }

        /* eslint-disable-next-line no-console */
        console.log(context.getProgramInfoLog(program));
        context.deleteProgram(program);

        return null;
    };

    const init = () => {
        const context = contextRef.current;
        if (!context) {
            return;
        }

        const vertexShader = createShader(context.VERTEX_SHADER, vertexShaderSrc);
        vertexShaderRef.current = vertexShader;

        const fragmentShader = createShader(context.FRAGMENT_SHADER, fragmentShaderSrc);
        fragmentShaderRef.current = fragmentShader;
        if (!vertexShader || !fragmentShader) {
            return;
        }

        const program = createProgram(vertexShader, fragmentShader);
        programRef.current = program;
        if (!program) {
            return;
        }

        positionAttributeLocation.current = context.getAttribLocation(program, 'a_position');
        matrixUniformLocation.current = context.getUniformLocation(program, 'u_matrix');
        colorAttributeLocation.current = context.getAttribLocation(program, 'a_color');

        positionBufferRef.current = context.createBuffer();
        colorBufferRef.current = context.createBuffer();

        positionsRef.current = [];
        colorsRef.current = [];
        matrixRef.current = [];
    };

    const resizeCanvasToDisplaySize = (multiplier = 1) => {
        if (!innerRef.current) {
            return false;
        }

        const width = innerRef.current.clientWidth * multiplier | 0;
        const height = innerRef.current.clientHeight * multiplier | 0;
        if (innerRef.current.width !== width || innerRef.current.height !== height) {
            widthRef.current = width;
            heightRef.current = height;
            return true;
        }
        return false;
    };

    const setMatrix = (
        scene: number[],
        translation: number[],
        rotation: number[],
        scale: number[],
    ) => {
        let matrix = m4.projection(scene[0], scene[1], scene[2]);
        matrix = m4.translate(matrix, translation[0], translation[1], translation[2]);
        matrix = m4.xRotate(matrix, rotation[0]);
        matrix = m4.yRotate(matrix, rotation[1]);
        matrix = m4.zRotate(matrix, rotation[2]);
        matrix = m4.scale(matrix, scale[0], scale[1], scale[2]);

        matrixRef.current = matrix;
    };

    const drawScene = () => {
        const context = contextRef.current;
        if (!context) {
            return;
        }

        resizeCanvasToDisplaySize();
        context.viewport(0, 0, context.canvas.width, context.canvas.height);

        // Clear the canvas AND the depth buffer.
        context.clear(context.COLOR_BUFFER_BIT | context.DEPTH_BUFFER_BIT);
        // Enable the depth buffer
        context.enable(context.DEPTH_TEST);

        context.useProgram(programRef.current);

        // Transform matrix
        if (matrixRef.current) {
            context.uniformMatrix4fv(
                matrixUniformLocation.current,
                false,
                matrixRef.current,
            );
        }

        context.bindBuffer(context.ARRAY_BUFFER, positionBufferRef.current);
        context.bufferData(
            context.ARRAY_BUFFER,
            new Float32Array(positionsRef.current),
            context.STATIC_DRAW,
        );

        context.bindBuffer(context.ARRAY_BUFFER, colorBufferRef.current);
        context.bufferData(
            context.ARRAY_BUFFER,
            new Uint8Array(colorsRef.current),
            context.STATIC_DRAW,
        );

        // Set up positions buffer
        context.enableVertexAttribArray(positionAttributeLocation.current);
        context.bindBuffer(context.ARRAY_BUFFER, positionBufferRef.current);
        context.vertexAttribPointer(
            positionAttributeLocation.current,
            3, // components per iteration
            context.FLOAT,
            false, // data normalization
            0, // 0 = move forward size * sizeof(type) each iteration to get the next position
            0, // start at the beginning of the buffer
        );

        // Set up colors buffer
        context.enableVertexAttribArray(colorAttributeLocation.current);
        context.bindBuffer(context.ARRAY_BUFFER, colorBufferRef.current);
        context.vertexAttribPointer(
            colorAttributeLocation.current,
            3, // components per iteration
            context.UNSIGNED_BYTE,
            true, // normalize the data (convert from 0-255 to 0-1)
            0, // 0 = move forward size * sizeof(type) each iteration to get the next position
            0, // start at the beginning of the buffer
        );

        const state = getState();

        const drawOffset = 0;
        const drawItems = (state.drawPath) ? 6 : 3;
        const drawCount = positionsRef.current.length / drawItems;
        const drawMode = (state.drawPath) ? context.LINES : context.POINTS;

        context.drawArrays(drawMode, drawOffset, drawCount);
    };

    const clear = () => {
        positionsRef.current = [];
        colorsRef.current = [];
    };

    const drawCircle = (x: number, y: number, _: number, color: RGBColor) => {
        positionsRef.current.push(x, y);
        colorsRef.current.push(color.r, color.g, color.b);
    };

    const drawPoint = (pos: Vector, color: RGBColor) => {
        positionsRef.current.push(pos.x, pos.y, pos.z);
        colorsRef.current.push(color.r, color.g, color.b);
    };

    const drawLine = (start: Vector, end: Vector, color: RGBColor) => {
        positionsRef.current.push(start.x, start.y, start.z);
        positionsRef.current.push(end.x, end.y, end.z);
        colorsRef.current.push(color.r, color.g, color.b);
    };

    useImperativeHandle<
        CanvasWebGLElement,
        CanvasWebGLElement
    >(ref, () => ({
        elem: innerRef.current,
        setMatrix,
        drawScene,
        clear,
        drawCircle,
        drawPoint,
        drawLine,
    }));

    useEffect(() => {
        contextRef.current = innerRef.current?.getContext('webgl') ?? null;
        if (!innerRef.current || !contextRef.current) {
            throw new Error('WebGL is not available');
        }

        widthRef.current = innerRef.current.width;
        heightRef.current = innerRef.current.height;

        init();

        const state = getState();

        setMatrix(
            [state.width, state.height, state.depth],
            [state.width / 2, state.height / 2, 0],
            [state.rotation.alpha, state.rotation.beta, state.rotation.gamma],
            [1, 1, 1],
        );
    }, []);

    return (
        <canvas {...props} ref={innerRef} />
    );
});

CanvasWebGL.displayName = 'CanvasWebGL';
