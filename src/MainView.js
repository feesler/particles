import { Canvas2D } from './Canvas2D.js';
import { CanvasWebGL } from './CanvasWebGL.js';
import { demos, findDemoById } from './demos.js';
import { Field } from './Field.js';
import { getEventPageCoordinates } from './utils.js';

const defaultProps = {
    autoStart: false,
    animationDelay: 10,
    initialScale: 0.1,
    timeStep: 0.1,
    scaleStep: 0,
    useField: true,
    useWebGL: true,
    demo: null,
    depth: 2000,
};

export class MainView {
    constructor(props) {
        this.props = {
            ...defaultProps,
            ...props,
        };

        this.scaleFactorElem = null;
        this.scaleFactorInp = null;
        this.countElem = null;
        this.perfElem = null;

        this.xRotationInp = null;
        this.xRotationText = null;

        this.yRotationInp = null;
        this.yRotationText = null;

        this.zRotationInp = null;
        this.zRotationText = null;

        this.toggleRunBtn = null;

        this.field = null;

        this.state = {
            paused: true,
            updating: false,
            rotating: false,
            rotation: { alpha: 0, beta: 0, gamma: 0 },
            timestamp: undefined,
            perfValue: 0,
            dragging: false,
            startPoint: null,
        };

        document.addEventListener('DOMContentLoaded', () => this.init());
    }

    createDemoOption(demo) {
        const option = document.createElement('option');
        option.textContent = demo.id;
        option.value = demo.id;

        return option;
    }

    init() {
        this.maincontainer = document.getElementById('maincontainer');

        // Demo select
        this.demoSelect = document.getElementById('demoSelect');
        this.demoSelect.addEventListener('change', (e) => this.onChangeDemo(e));
        demos.forEach((item) => {
            if (item.type === 'group') {
                const optgroup = document.createElement('optgroup');
                optgroup.label = item.title;

                const groupOptions = item.items.map((i) => this.createDemoOption(i));
                optgroup.append(...groupOptions);

                this.demoSelect.append(optgroup);
            } else {
                const option = this.createDemoOption(item);
                this.demoSelect.append(option);
            }
        });

        // Scale Factor input
        this.scaleFactorInp = document.getElementById('scaleFactorInp');
        this.scaleFactorInp.disabled = !this.props.useField;
        if (this.props.useField) {
            this.scaleFactorInp.addEventListener('input', (e) => this.onScale(e));
        }
        this.scaleFactorElem = document.getElementById('scalefactor');

        this.countElem = document.getElementById('particlescount');
        this.perfElem = document.getElementById('perfvalue');

        this.xRotationInp = document.getElementById('xRotationInp');
        this.xRotationInp.disabled = !this.props.useField;
        if (this.props.useField) {
            this.xRotationInp.addEventListener('input', (e) => this.onXRotate(e));
        }
        this.xRotationText = document.getElementById('xrotate');

        this.yRotationInp = document.getElementById('yRotationInp');
        this.yRotationInp.disabled = !this.props.useField;
        if (this.props.useField) {
            this.yRotationInp.addEventListener('input', (e) => this.onYRotate(e));
        }
        this.yRotationText = document.getElementById('yrotate');

        this.zRotationInp = document.getElementById('zRotationInp');
        this.zRotationInp.disabled = !this.props.useField;
        if (this.props.useField) {
            this.zRotationInp.addEventListener('input', (e) => this.onZRotate(e));
        }
        this.zRotationText = document.getElementById('zrotate');

        this.toggleRunBtn = document.getElementById('toggleRunBtn');
        this.toggleRunBtn.disabled = !this.props.useField;
        if (!this.toggleRunBtn.disabled) {
            this.toggleRunBtn.addEventListener('click', () => this.onToggleRun());
        }

        this.start();
    }

    createCanvas() {
        if (this.canvasElem) {
            this.canvasElem.remove();
        }

        this.canvasElem = document.createElement('canvas');
        this.canvasElem.setAttribute('width', '1500');
        this.canvasElem.setAttribute('height', '800');

        this.maincontainer.prepend(this.canvasElem);
        if (!this.canvasElem) {
            return;
        }

        this.canvasElem.addEventListener('touchstart', (e) => this.onMouseDown(e));
        this.canvasElem.addEventListener('touchmove', (e) => this.onMouseMove(e));
        this.canvasElem.addEventListener('touchend', (e) => this.onMouseUp(e));
        this.canvasElem.addEventListener('touchcancel', (e) => this.onMouseUp(e));
        this.canvasElem.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvasElem.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvasElem.addEventListener('mouseup', (e) => this.onMouseUp(e));

        if (this.props.useWebGL) {
            this.canvas = new CanvasWebGL(this.canvasElem);
            this.canvas.setMatrix(
                [this.canvasElem.clientWidth, this.canvasElem.clientHeight, this.props.depth],
                [this.canvasElem.clientWidth / 2, this.canvasElem.clientHeight / 2, 0],
                [this.state.rotation.alpha, this.state.rotation.beta, this.state.rotation.gamma],
                [1, 1, 1],
            );
        } else {
            this.canvas = new Canvas2D(this.canvasElem);
        }
    }

    initDemo(demo) {
        if (!demo?.getProps) {
            this.props = {
                ...this.props,
                ...defaultProps,
                demo,
            };

            return;
        }

        const props = demo.getProps();
        this.props = {
            ...this.props,
            ...props,
            demo,
        };
    }

    setScaleStep(step) {
        this.props.scaleStep = step;
    }

    start() {
        this.createCanvas();

        if (this.props.useField) {
            this.field = new Field(this.canvas, this.props.initialScale, this.props.timeStep);
        }

        if (this.props.demo) {
            if (this.props.demo.init) {
                this.props.demo.init(this);
            } else {
                this.props.demo(this);
            }
        }

        if (this.props.useField) {
            this.field.drawFrame();
        }

        this.render();

        if (this.props.useField && this.props.autoStart) {
            this.run();
        }
    }

    pause() {
        if (this.state.paused) {
            return;
        }

        this.state.paused = true;
        this.render();
    }

    run() {
        if (!this.state.paused) {
            return;
        }

        this.state.paused = false;
        this.render();
        requestAnimationFrame((t) => this.update(t));
    }

    onChangeDemo(e) {
        const id = e.target.value;
        const demoItem = findDemoById(id);

        let demo;
        if (demoItem.type === 'canvas') {
            const DemoClass = demoItem.init;
            demo = new DemoClass();
        } else if (demoItem.type === 'field') {
            demo = demoItem.init;
        }

        this.state = {
            paused: true,
            updating: false,
            rotating: false,
            rotation: { alpha: 0, beta: 0, gamma: 0 },
            timestamp: undefined,
            perfValue: 0,
            dragging: false,
            startPoint: null,
        };

        this.initDemo(demo);
        this.start();
    }

    onScale(e) {
        const val = parseFloat(e.target.value);

        this.field.setScaleFactor(val);
        this.render();
    }

    processRotation(a, b, g, pb) {
        this.state.rotating = true;

        if (this.state.updating) {
            setTimeout(() => this.processRotation(a, b, g, pb), 10);
        }

        if (this.props.useWebGL) {
            const canvasElem = this.canvas.elem;
            this.canvas.setMatrix(
                [canvasElem.clientWidth, canvasElem.clientHeight, this.props.depth],
                [canvasElem.clientWidth / 2, canvasElem.clientHeight / 2, 0],
                [this.state.rotation.alpha, this.state.rotation.beta, this.state.rotation.gamma],
                [1, 1, 1],
            );
        } else {
            this.field.rotate(a, b, g);
        }

        this.field.drawFrame();

        if (pb) {
            this.render();
        } else {
            this.run();
        }

        this.state.rotating = false;
    }

    onMouseDown(e) {
        if (this.state.dragging) {
            return;
        }

        this.state.startPoint = getEventPageCoordinates(e);

        this.state.dragging = true;
    }

    onMouseMove(e) {
        const { dragging, startPoint } = this.state;
        if (!dragging || !startPoint) {
            return;
        }

        const newPoint = getEventPageCoordinates(e);

        const deltaScale = 0.0001;

        const deltaX = (newPoint.x - startPoint.x) * deltaScale;
        const deltaY = (newPoint.y - startPoint.y) * deltaScale;

        const pausedBefore = this.state.paused;
        this.pause();

        const valY = deltaY + this.state.rotation.alpha;
        const valX = deltaX + this.state.rotation.beta;

        this.state.rotation.alpha = valY;
        this.state.rotation.beta = valX;

        this.processRotation(valY, valX, 0, pausedBefore);
    }

    onMouseUp() {
        this.state.dragging = false;
        this.state.startPoint = null;
    }

    onXRotate(e) {
        const pausedBefore = this.state.paused;
        this.pause();

        const val = parseFloat(e.target.value);
        const delta = val - this.state.rotation.alpha;
        this.state.rotation.alpha = val;

        this.processRotation(delta, 0, 0, pausedBefore);
    }

    onYRotate(e) {
        const pausedBefore = this.state.paused;
        this.pause();

        const val = parseFloat(e.target.value);
        const delta = val - this.state.rotation.beta;
        this.state.rotation.beta = val;

        this.processRotation(0, delta, 0, pausedBefore);
    }

    onZRotate(e) {
        const pausedBefore = this.state.paused;
        this.pause();

        const val = parseFloat(e.target.value);
        const delta = val - this.state.rotation.gamma;
        this.state.rotation.gamma = val;

        this.processRotation(0, 0, delta, pausedBefore);
    }

    onToggleRun() {
        if (this.state.paused) {
            this.run();
        } else {
            this.pause();
        }
    }

    update(timestamp) {
        if (this.state.rotating || this.state.paused) {
            return;
        }

        this.state.updating = true;

        const pBefore = performance.now();

        const dt = (this.state.timestamp) ? (timestamp - this.state.timestamp) : 0;
        this.state.timestamp = timestamp;

        this.field.calculate(dt);
        this.field.drawFrame();
        if (this.props.scaleStep !== 0) {
            this.field.setScaleFactor(this.field.scaleFactor + this.props.scaleStep);
        }

        this.state.perfValue = Math.round(performance.now() - pBefore);

        this.render();

        if (!this.state.paused) {
            requestAnimationFrame((t) => this.update(t));
        }

        this.state.updating = false;
    }

    render() {
        if (!this.props.useField) {
            return;
        }

        const sfText = this.field.scaleFactor.toFixed(3);
        const sfValue = parseFloat(sfText);

        this.scaleFactorElem.textContent = sfText;
        this.scaleFactorInp.value = sfValue;
        this.countElem.textContent = this.field.particles.length;
        this.perfElem.textContent = this.state.perfValue;

        this.toggleRunBtn.textContent = (this.state.paused) ? 'Run' : 'Pause';

        this.xRotationText.textContent = this.state.rotation.alpha.toFixed(2);
        this.yRotationText.textContent = this.state.rotation.beta.toFixed(2);
        this.zRotationText.textContent = this.state.rotation.gamma.toFixed(2);
    }
}
