import * as m4 from './engine/Matrix4.ts';
import { Vector } from './engine/Vector.ts';
import { RGBColor } from './particles/types.ts';

export class CanvasWebGL {
    elem: HTMLCanvasElement;
    context: WebGLRenderingContext | null;
    width: number;
    height: number;

    vertexShaderSrc: string;
    fragmentShaderSrc: string;

    vertexShader: WebGLShader | null = null;
    fragmentShader: WebGLShader | null = null;

    program: WebGLProgram | null = null;

    positionAttributeLocation: number = 0;
    matrixUniformLocation: WebGLUniformLocation | null = null;
    colorAttributeLocation: number = 0;

    positionBuffer: WebGLBuffer | null = null;
    colorBuffer: WebGLBuffer | null = null;

    positions: number[] = [];
    colors: number[] = [];
    matrix: number[] | null = null;

    constructor(elem: HTMLElement) {
        if (!(elem instanceof HTMLCanvasElement)) {
            throw new Error('Invalid canvas element');
        }

        this.elem = elem;
        this.context = elem.getContext('webgl');
        if (!this.context) {
            throw new Error('WebGL is not available');
        }
        this.width = elem.width;
        this.height = elem.height;

        this.vertexShaderSrc = `
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

        this.fragmentShaderSrc = `
            precision mediump float;
            varying vec3 v_color;

            void main() {
                gl_FragColor = vec4(v_color, 1.0);
            }
        `;

        this.init();
    }

    createShader(type: number, source: string): WebGLShader | null {
        if (!this.context) {
            return null;
        }

        const shader = this.context.createShader(type);
        if (!shader) {
            return null;
        }

        this.context.shaderSource(shader, source);
        this.context.compileShader(shader);
        const success = this.context.getShaderParameter(shader, this.context.COMPILE_STATUS);
        if (success) {
            return shader;
        }

        console.log(this.context.getShaderInfoLog(shader));
        this.context.deleteShader(shader);

        return null;
    }

    createProgram(vertexShader: WebGLShader, fragmentShader: WebGLShader) {
        if (!this.context) {
            return null;
        }

        const program = this.context.createProgram();
        if (!program) {
            return null;
        }

        this.context.attachShader(program, vertexShader);
        this.context.attachShader(program, fragmentShader);
        this.context.linkProgram(program);
        const success = this.context.getProgramParameter(program, this.context.LINK_STATUS);
        if (success) {
            return program;
        }

        console.log(this.context.getProgramInfoLog(program));
        this.context.deleteProgram(program);

        return null;
    }

    init() {
        if (!this.context) {
            return null;
        }

        this.vertexShader = this.createShader(this.context.VERTEX_SHADER, this.vertexShaderSrc);
        this.fragmentShader = this.createShader(this.context.FRAGMENT_SHADER, this.fragmentShaderSrc);
        if (!this.vertexShader || !this.fragmentShader) {
            return;
        }

        this.program = this.createProgram(this.vertexShader, this.fragmentShader);
        if (!this.program) {
            return null;
        }

        this.positionAttributeLocation = this.context.getAttribLocation(this.program, 'a_position');
        this.matrixUniformLocation = this.context.getUniformLocation(this.program, 'u_matrix');
        this.colorAttributeLocation = this.context.getAttribLocation(this.program, 'a_color');

        this.positionBuffer = this.context.createBuffer();
        this.colorBuffer = this.context.createBuffer();

        this.positions = [];
        this.colors = [];
        this.matrix = null;
    }

    resizeCanvasToDisplaySize(multiplier = 1) {
        const width = this.elem.clientWidth * multiplier | 0;
        const height = this.elem.clientHeight * multiplier | 0;
        if (this.elem.width !== width || this.elem.height !== height) {
            this.elem.width = width;
            this.elem.height = height;
            return true;
        }
        return false;
    }

    setMatrix(scene: number[], translation: number[], rotation: number[], scale: number[]) {
        let matrix = m4.projection(scene[0], scene[1], scene[2]);
        matrix = m4.translate(matrix, translation[0], translation[1], translation[2]);
        matrix = m4.xRotate(matrix, rotation[0]);
        matrix = m4.yRotate(matrix, rotation[1]);
        matrix = m4.zRotate(matrix, rotation[2]);
        matrix = m4.scale(matrix, scale[0], scale[1], scale[2]);

        this.matrix = matrix;
    }

    drawScene() {
        if (!this.context) {
            return;
        }

        this.resizeCanvasToDisplaySize();
        this.context.viewport(0, 0, this.context.canvas.width, this.context.canvas.height);

        // Clear the canvas AND the depth buffer.
        this.context.clear(this.context.COLOR_BUFFER_BIT | this.context.DEPTH_BUFFER_BIT);
        // Enable the depth buffer
        this.context.enable(this.context.DEPTH_TEST);

        this.context.useProgram(this.program);

        // Transform matrix
        if (this.matrix) {
            this.context.uniformMatrix4fv(this.matrixUniformLocation, false, this.matrix);
        }

        this.context.bindBuffer(this.context.ARRAY_BUFFER, this.positionBuffer);
        this.context.bufferData(this.context.ARRAY_BUFFER, new Float32Array(this.positions), this.context.STATIC_DRAW);

        this.context.bindBuffer(this.context.ARRAY_BUFFER, this.colorBuffer);
        this.context.bufferData(this.context.ARRAY_BUFFER, new Uint8Array(this.colors), this.context.STATIC_DRAW);

        // Set up positions buffer
        this.context.enableVertexAttribArray(this.positionAttributeLocation);
        this.context.bindBuffer(this.context.ARRAY_BUFFER, this.positionBuffer);
        this.context.vertexAttribPointer(
            this.positionAttributeLocation,
            3, // components per iteration
            this.context.FLOAT,
            false, // data normalization
            0, // 0 = move forward size * sizeof(type) each iteration to get the next position
            0, // start at the beginning of the buffer
        );

        // Set up colors buffer
        this.context.enableVertexAttribArray(this.colorAttributeLocation);
        this.context.bindBuffer(this.context.ARRAY_BUFFER, this.colorBuffer);
        this.context.vertexAttribPointer(
            this.colorAttributeLocation,
            3, // components per iteration
            this.context.UNSIGNED_BYTE,
            true, // normalize the data (convert from 0-255 to 0-1)
            0, // 0 = move forward size * sizeof(type) each iteration to get the next position
            0, // start at the beginning of the buffer
        );

        const drawOffset = 0;
        const drawCount = this.positions.length / 3;
        this.context.drawArrays(this.context.POINTS, drawOffset, drawCount);
    }

    clear() {
        this.positions = [];
        this.colors = [];
    }

    drawCircle(x: number, y: number, _: number, color: RGBColor) {
        this.positions.push(x, y);
        this.colors.push(color.r, color.g, color.b);
    }

    drawPoint(pos: Vector, color: RGBColor) {
        this.positions.push(pos.x, pos.y, pos.z);
        this.colors.push(color.r, color.g, color.b);
    }
}
