import { useStore } from '@jezvejs/react';
import { ChangeEvent, useEffect, useRef } from 'react';
import { Canvas2D } from '../../Canvas2D.ts';
import { CanvasWebGL } from '../../CanvasWebGL.ts';
import { DemoClass, DemoItem, DemoItemFunc, demos, findDemoById } from '../../demos.ts';
import { Field } from '../../engine/Field.ts';
import { getEventPageCoordinates, mapItems } from '../../utils.ts';
import { Canvas, Point, View } from '../../types.ts';

const demosList = mapItems(demos, (item) => ({
    ...item,
    title: item.id,
    type: (['field', 'canvas'].includes(item.type)) ? 'button' : item.type,
}));

const SelectOption = (item: DemoItem) => (
    <option value={item.id}>{item.id}</option>
);

type DemoSelectProps = React.HTMLAttributes<HTMLSelectElement> & {
    items: DemoItem[];
};

const DemoSelect = ({ items, ...props }: DemoSelectProps) => (
    <select {...props}>
        {items?.map((item) => (
            (item.type === 'group')
                ? (
                    <optgroup label={item.title} key={`demogr_${item.id}`}>
                        {item.items?.map((child) => (
                            <SelectOption {...child} key={`demochild_${child.id}`} />
                        ))}
                    </optgroup>
                )
                : <SelectOption {...item} key={`demosel_${item.id}`} />
        ))}
    </select>
);

const defaultProps = {
    autoStart: false,
    animationDelay: 10,
    initialScale: 0.1,
    timeStep: 0.1,
    scaleFactor: 0,
    scaleStep: 0,
    useField: true,
    useWebGL: true,
    demo: null,
    depth: 2000,
};

const initialState = {
    paused: true,
    updating: false,
    rotating: false,
    rotation: { alpha: 0, beta: 0, gamma: 0 },
    timestamp: undefined,
    perfValue: 0,
    dragging: false,
    startPoint: null,
};

export const getInitialState = (props = {}, defProps = defaultProps) => ({
    ...props,
    ...defProps,
    ...initialState,
});

export interface AppState {
    autoStart: boolean;
    useField: boolean;
    useWebGL: boolean;

    animationDelay: number;

    initialScale: number;
    timeStep: number;
    scaleStep: number;
    scaleFactor: number;

    paused: boolean;
    updating: boolean;
    rotating: boolean;

    rotation: { alpha: 0, beta: 0, gamma: 0; },

    timestamp: number;
    perfValue: number;
    depth: number;

    dragging: boolean;

    startPoint: Point | null;

    demo: DemoClass | DemoItemFunc;
}

export const MainView = () => {
    const { state, getState, setState } = useStore<AppState>();

    const fieldRef = useRef<Field | null>(null);
    const canvasRef = useRef(null);
    const canvasHandlerRef = useRef<Canvas2D | CanvasWebGL | null>(null);

    const update = (timestamp: number) => {
        let st = getState();
        if (st.rotating || st.paused) {
            return;
        }

        setState((prev: AppState) => ({ ...prev, updating: true }));
        const pBefore = performance.now();

        const dt = (st.timestamp) ? (timestamp - st.timestamp) : 0;
        setState((prev: AppState) => ({ ...prev, timestamp }));

        const field = fieldRef.current;
        if (!field) {
            return;
        }

        field.calculate(dt);
        field.drawFrame();
        if (st.scaleStep !== 0) {
            setState((prev: AppState) => ({
                ...prev,
                scaleFactor: prev.scaleFactor + prev.scaleStep,
            }));

            st = getState();
            field.setScaleFactor(st.scaleFactor);
        }

        const perfValue = Math.round(performance.now() - pBefore);
        setState((prev: AppState) => ({ ...prev, perfValue }));

        if (!st.paused) {
            requestAnimationFrame((t) => update(t));
        }

        setState((prev: AppState) => ({ ...prev, updating: false }));
    };

    const pause = () => {
        if (state.paused) {
            return;
        }

        setState((prev: AppState) => ({ ...prev, paused: true }));
    };

    const run = () => {
        if (!state.paused) {
            return;
        }

        setState((prev: AppState) => ({ ...prev, paused: false }));

        requestAnimationFrame((t) => update(t));
    };

    const initDemo = (demo: DemoClass | DemoItemFunc) => {
        if (typeof demo === 'function') {
            setState((prev: AppState) => ({
                ...prev,
                ...initialState,
                demo,
            }));

            return;
        }

        const props = demo.getProps();
        setState((prev: AppState) => ({
            ...prev,
            ...props,
            demo,
        }));
    };


    const start = () => {
        const st = getState();
        const { demo } = st;

        const canvas = canvasHandlerRef.current as Canvas;
        if (!canvas) {
            return;
        }

        if (st.useField) {
            fieldRef.current = new Field(canvas, state.initialScale, state.timeStep);
            fieldRef.current.useWebGL = st.useWebGL;
        }

        const view: View = {
            field: fieldRef.current,
            canvas,
            setScaleStep: (scaleStep: number) => setState((prev: AppState) => ({ ...prev, scaleStep })),
        };

        if (demo) {
            if (('init' in demo) && demo.init) {
                demo.init(view);
            } else if (typeof demo === 'function') {
                demo(view);
            }
        }

        if (st.useField) {
            fieldRef.current?.drawFrame();
        }

        if (st.useField && st.autoStart) {
            run();
        }
    };

    const processRotation = (a: number, b: number, g: number, pb: boolean) => {
        setState((prev: AppState) => ({ ...prev, rotating: true }));

        const st = getState();

        if (st.updating) {
            setTimeout(() => processRotation(a, b, g, pb), 10);
        }

        if (st.useWebGL && canvasRef.current) {
            const { clientWidth, clientHeight } = canvasRef.current;

            const webGLCanvas = canvasHandlerRef.current as CanvasWebGL;
            webGLCanvas?.setMatrix(
                [clientWidth, clientHeight, st.depth],
                [clientWidth / 2, clientHeight / 2, 0],
                [st.rotation.alpha, st.rotation.beta, st.rotation.gamma],
                [1, 1, 1],
            );
        } else if (!st.useWebGL) {
            fieldRef.current?.rotate(a, b, g);
        }

        fieldRef.current?.drawFrame();

        if (!pb) {
            run();
        }

        setState((prev: AppState) => ({ ...prev, rotating: false }));
    };

    const onMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
        const st = getState();
        if (st.dragging) {
            return;
        }

        const startPoint = getEventPageCoordinates(e);

        setState((prev: AppState) => ({
            ...prev,
            startPoint,
            dragging: true,
        }));
    };

    const onMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
        const st = getState();
        const { dragging, startPoint } = st;
        if (!dragging || !startPoint) {
            return;
        }

        const newPoint = getEventPageCoordinates(e);

        const deltaScale = 0.0001;

        const deltaX = (newPoint.x - startPoint.x) * deltaScale;
        const deltaY = (newPoint.y - startPoint.y) * deltaScale;

        const pausedBefore = st.paused;
        pause();

        const valY = deltaY + st.rotation.alpha;
        const valX = deltaX + st.rotation.beta;

        setState((prev: AppState) => ({
            ...prev,
            rotation: {
                ...prev.rotation,
                alpha: valY,
                beta: valX,
            },
        }));

        processRotation(valY, valX, 0, pausedBefore);
    };

    const onMouseUp = () => {
        setState((prev: AppState) => ({
            ...prev,
            dragging: false,
            startPoint: null,
        }));
    };

    const onChangeDemo = (e: ChangeEvent<HTMLSelectElement>) => {
        const id = e.target.value;
        const demoItem = findDemoById(id);
        if (!demoItem) {
            return;
        }

        let demo;
        if (demoItem.type === 'canvas') {
            const DemoClass = demoItem.demo;
            if (!DemoClass) {
                return;
            }

            demo = new DemoClass();
        } else if (demoItem.type === 'field') {
            demo = demoItem.init;
        }
        if (!demo) {
            return;
        }

        setState((prev: AppState) => ({
            ...prev,
            paused: true,
            updating: false,
            rotating: false,
            rotation: { alpha: 0, beta: 0, gamma: 0 },
            timestamp: undefined,
            perfValue: 0,
            dragging: false,
            startPoint: null,
        }));

        initDemo(demo);
        start();
    };

    const onScale = (e: ChangeEvent<HTMLInputElement>) => {
        const scaleFactor = parseFloat(e.target.value);

        setState((prev: AppState) => ({ ...prev, scaleFactor }));
        fieldRef.current?.setScaleFactor(scaleFactor);
    };

    const onXRotate = (e: ChangeEvent<HTMLInputElement>) => {
        const st = getState();

        const pausedBefore = st.paused;
        pause();

        const val = parseFloat(e.target.value);
        const delta = val - st.rotation.alpha;

        setState((prev: AppState) => ({
            ...prev,
            rotation: {
                ...prev.rotation,
                alpha: val,
            },
        }));

        processRotation(delta, 0, 0, pausedBefore);
    };

    const onYRotate = (e: ChangeEvent<HTMLInputElement>) => {
        const st = getState();
        const pausedBefore = st.paused;
        pause();

        const val = parseFloat(e.target.value);
        const delta = val - st.rotation.beta;

        setState((prev: AppState) => ({
            ...prev,
            rotation: {
                ...prev.rotation,
                beta: val,
            },
        }));

        processRotation(0, delta, 0, pausedBefore);
    };

    const onZRotate = (e: ChangeEvent<HTMLInputElement>) => {
        const st = getState();
        const pausedBefore = st.paused;
        pause();

        const val = parseFloat(e.target.value);
        const delta = val - st.rotation.gamma;

        setState((prev: AppState) => ({
            ...prev,
            rotation: {
                ...prev.rotation,
                gamma: val,
            },
        }));

        processRotation(0, 0, delta, pausedBefore);
    };

    const onToggleRun = () => {
        if (state.paused) {
            run();
        } else {
            pause();
        }
    };

    const canvasProps = {
        width: 1500,
        height: 800,
        onTouchStart: onMouseDown,
        onTouchMove: onMouseMove,
        onTouchEnd: onMouseUp,
        onMouseDown,
        onMouseMove,
        onMouseUp,
    };

    const lstate = getState();
    const { useWebGL } = lstate;

    useEffect(() => {
        if (!canvasRef.current || canvasHandlerRef.current) {
            return;
        }

        const st = getState();
        const canvasElem = canvasRef.current;
        if (st.useWebGL) {
            canvasHandlerRef.current = new CanvasWebGL(canvasElem);
            const { clientWidth, clientHeight } = canvasElem;

            canvasHandlerRef.current.setMatrix(
                [clientWidth, clientHeight, st.depth],
                [clientWidth / 2, clientHeight / 2, 0],
                [st.rotation.alpha, st.rotation.beta, st.rotation.gamma],
                [1, 1, 1],
            );
        } else {
            canvasHandlerRef.current = new Canvas2D(canvasElem);
        }
    }, [canvasRef.current, useWebGL]);

    useEffect(() => {
        start();
    }, []);

    const canvas = (
        <canvas {...canvasProps} ref={canvasRef} />
    );

    return (
        <div id="maincontainer" className="container">
            <main>
                {canvas}
            </main>
            <section className="data-section">
                <div className="date-value">
                    <label>Demo</label>
                    <DemoSelect id="demoSelect" items={demosList} onChange={onChangeDemo} />
                </div>

                <div className="date-value">
                    <label>Scale factor</label>
                    <input
                        id="scaleFactorInp"
                        type="range"
                        min="0.001"
                        max="20"
                        step="0.01"
                        value={state.scaleFactor.toFixed(3)}
                        onChange={onScale}
                    />
                    <span id="scalefactor">{state.scaleFactor.toFixed(3)}</span>
                </div>

                <div className="date-value">
                    <label>Particles</label>
                    <span id="particlescount">{fieldRef.current?.particles.length ?? 0}</span>
                </div>
                <div className="date-value">
                    <label>Performance</label>
                    <span id="perfvalue">{state.perfValue}</span>
                </div>

                <div className="date-value">
                    <label>Rotate X</label>
                    <input
                        id="xRotationInp"
                        type="range"
                        min="-3"
                        max="3"
                        step="0.01"
                        value={state.rotation.alpha.toFixed(2)}
                        onChange={onXRotate}
                    />
                    <span id="xrotate">{state.rotation.alpha.toFixed(2)}</span>
                </div>

                <div className="date-value">
                    <label>Rotate Y</label>
                    <input
                        id="yRotationInp"
                        type="range"
                        min="-3"
                        max="3"
                        step="0.01"
                        value={state.rotation.beta.toFixed(2)}
                        onChange={onYRotate}
                    />
                    <span id="yrotate">{state.rotation.beta.toFixed(2)}</span>
                </div>

                <div className="date-value">
                    <label>Rotate Z</label>
                    <input
                        id="zRotationInp"
                        type="range"
                        min="-3"
                        max="3"
                        step="0.01"
                        value={state.rotation.gamma.toFixed(2)}
                        onChange={onZRotate}
                    />
                    <span id="zrotate">{state.rotation.gamma.toFixed(2)}</span>
                </div>

                <div>
                    <button id="toggleRunBtn" type="button" onClick={onToggleRun}>
                        {(state.paused) ? 'Run' : 'Pause'}
                    </button>
                </div>
            </section>
        </div>
    );
};
