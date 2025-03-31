import { useStore } from '@jezvejs/react';
import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

import * as m4 from '../../engine/Matrix4.ts';
import { Vector } from 'src/engine/Vector/Vector.ts';
import { RGBColor } from 'src/particles/types.ts';
import { AppState } from 'src/types.ts';

export type CanvasWebGLElement = {
    elem: HTMLCanvasElement | null;
    setMatrix: (scene: number[], translation: number[], rotation: number[], scale: number[]) => void;
    drawScene: () => void;
    clear: () => void;
    drawCircle: (x: number, y: number, _: number, color: RGBColor) => void;
    drawPoint: (pos: Vector, color: RGBColor) => void;
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
    const { state } = useStore<AppState>();

    const contextRef = useRef<WebGLRenderingContext | null>(null);
    const widthRef = useRef<number | null>(null);
    const heightRef = useRef<number | null>(null);

    const programRef = useRef<WebGLProgram | null>(null);
    const vertexShader = useRef<WebGLShader | null>(null);
    const fragmentShader = useRef<WebGLShader | null>(null);
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
        if (!contextRef.current) {
            return null;
        }

        const shader = contextRef.current.createShader(type);
        if (!shader) {
            return null;
        }

        contextRef.current.shaderSource(shader, source);
        contextRef.current.compileShader(shader);
        const success = contextRef.current.getShaderParameter(shader, contextRef.current.COMPILE_STATUS);
        if (success) {
            return shader;
        }

        /* eslint-disable-next-line no-console */
        console.log(contextRef.current.getShaderInfoLog(shader));
        contextRef.current.deleteShader(shader);

        return null;
    };

    const createProgram = (vertexShader: WebGLShader, fragmentShader: WebGLShader) => {
        if (!contextRef.current) {
            return null;
        }

        const program = contextRef.current.createProgram();
        if (!program) {
            return null;
        }

        contextRef.current.attachShader(program, vertexShader);
        contextRef.current.attachShader(program, fragmentShader);
        contextRef.current.linkProgram(program);
        const success = contextRef.current.getProgramParameter(program, contextRef.current.LINK_STATUS);
        if (success) {
            return program;
        }

        /* eslint-disable-next-line no-console */
        console.log(contextRef.current.getProgramInfoLog(program));
        contextRef.current.deleteProgram(program);

        return null;
    };

    const init = () => {
        if (!contextRef.current) {
            return null;
        }

        vertexShader.current = createShader(contextRef.current.VERTEX_SHADER, vertexShaderSrc);
        fragmentShader.current = createShader(contextRef.current.FRAGMENT_SHADER, fragmentShaderSrc);
        if (!vertexShader.current || !fragmentShader.current) {
            return;
        }

        programRef.current = createProgram(vertexShader.current, fragmentShader.current);
        if (!programRef.current) {
            return null;
        }

        positionAttributeLocation.current = contextRef.current.getAttribLocation(programRef.current, 'a_position');
        matrixUniformLocation.current = contextRef.current.getUniformLocation(programRef.current, 'u_matrix');
        colorAttributeLocation.current = contextRef.current.getAttribLocation(programRef.current, 'a_color');

        positionBufferRef.current = contextRef.current.createBuffer();
        colorBufferRef.current = contextRef.current.createBuffer();

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

    const setMatrix = (scene: number[], translation: number[], rotation: number[], scale: number[]) => {
        let matrix = m4.projection(scene[0], scene[1], scene[2]);
        matrix = m4.translate(matrix, translation[0], translation[1], translation[2]);
        matrix = m4.xRotate(matrix, rotation[0]);
        matrix = m4.yRotate(matrix, rotation[1]);
        matrix = m4.zRotate(matrix, rotation[2]);
        matrix = m4.scale(matrix, scale[0], scale[1], scale[2]);

        matrixRef.current = matrix;
    };

    const drawScene = () => {
        if (!contextRef.current) {
            return;
        }

        resizeCanvasToDisplaySize();
        contextRef.current.viewport(0, 0, contextRef.current.canvas.width, contextRef.current.canvas.height);

        // Clear the canvas AND the depth buffer.
        contextRef.current.clear(contextRef.current.COLOR_BUFFER_BIT | contextRef.current.DEPTH_BUFFER_BIT);
        // Enable the depth buffer
        contextRef.current.enable(contextRef.current.DEPTH_TEST);

        contextRef.current.useProgram(programRef.current);

        // Transform matrix
        if (matrixRef.current) {
            contextRef.current.uniformMatrix4fv(matrixUniformLocation.current, false, matrixRef.current);
        }

        contextRef.current.bindBuffer(contextRef.current.ARRAY_BUFFER, positionBufferRef.current);
        contextRef.current.bufferData(contextRef.current.ARRAY_BUFFER, new Float32Array(positionsRef.current), contextRef.current.STATIC_DRAW);

        contextRef.current.bindBuffer(contextRef.current.ARRAY_BUFFER, colorBufferRef.current);
        contextRef.current.bufferData(contextRef.current.ARRAY_BUFFER, new Uint8Array(colorsRef.current), contextRef.current.STATIC_DRAW);

        // Set up positions buffer
        contextRef.current.enableVertexAttribArray(positionAttributeLocation.current);
        contextRef.current.bindBuffer(contextRef.current.ARRAY_BUFFER, positionBufferRef.current);
        contextRef.current.vertexAttribPointer(
            positionAttributeLocation.current,
            3, // components per iteration
            contextRef.current.FLOAT,
            false, // data normalization
            0, // 0 = move forward size * sizeof(type) each iteration to get the next position
            0, // start at the beginning of the buffer
        );

        // Set up colors buffer
        contextRef.current.enableVertexAttribArray(colorAttributeLocation.current);
        contextRef.current.bindBuffer(contextRef.current.ARRAY_BUFFER, colorBufferRef.current);
        contextRef.current.vertexAttribPointer(
            colorAttributeLocation.current,
            3, // components per iteration
            contextRef.current.UNSIGNED_BYTE,
            true, // normalize the data (convert from 0-255 to 0-1)
            0, // 0 = move forward size * sizeof(type) each iteration to get the next position
            0, // start at the beginning of the buffer
        );

        const drawOffset = 0;
        const drawCount = positionsRef.current.length / 3;
        contextRef.current.drawArrays(contextRef.current.POINTS, drawOffset, drawCount);
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
    }));

    useEffect(() => {
        contextRef.current = innerRef.current?.getContext('webgl') ?? null;
        if (!innerRef.current || !contextRef.current) {
            throw new Error('WebGL is not available');
        }

        widthRef.current = innerRef.current.width;
        heightRef.current = innerRef.current.height;

        init();

        setMatrix(
            [state.width, state.height, state.depth],
            [state.width / 2, state.height / 2, 0],
            [state.rotation.alpha, state.rotation.beta, state.rotation.gamma],
            [1, 1, 1],
        );
        /* eslint-disable-next-line react-hooks/exhaustive-deps */
    }, []);

    return (
        <canvas {...props} ref={innerRef} />
    );
});

CanvasWebGL.displayName = 'CanvasWebGL';
