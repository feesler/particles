import { useEffect, useRef } from 'react';
import { Canvas2D } from '../../Canvas2D.js';
import { CanvasWebGL } from '../../CanvasWebGL.js';
import { demos, findDemoById } from '../../demos.js';
import { Field } from '../../engine/Field.js';
import { getEventPageCoordinates, mapItems } from '../../utils.js';
import { useStore } from '../../utils/Store/StoreProvider.jsx';

const demosList = mapItems(demos, (item) => ({
    ...item,
    title: item.id,
    type: (['field', 'canvas'].includes(item.type)) ? 'button' : item.type,
}));

const SelectOption = (item) => (
    <option value={item.id}>{item.id}</option>
);

const DemoSelect = ({ items, ...props }) => (
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
    useWebGL: false, //true,
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

export const MainView = () => {
    const { state, getState, setState } = useStore();

    const fieldRef = useRef(null);
    const canvasRef = useRef(null);
    const canvasHandlerRef = useRef(null);

    const update = (timestamp) => {
        let st = getState();
        if (st.rotating || st.paused) {
            return;
        }

        setState((prev) => ({ ...prev, updating: true }));
        const pBefore = performance.now();

        const dt = (st.timestamp) ? (timestamp - st.timestamp) : 0;
        setState((prev) => ({ ...prev, timestamp }));

        const field = fieldRef.current;

        field.calculate(dt);
        field.drawFrame();
        if (st.scaleStep !== 0) {
            setState((prev) => ({
                ...prev,
                scaleFactor: prev.scaleFactor + prev.scaleStep,
            }));

            st = getState();
            fieldRef.current.setScaleFactor(st.scaleFactor);
        }

        const perfValue = Math.round(performance.now() - pBefore);
        setState((prev) => ({ ...prev, perfValue }));

        if (!st.paused) {
            requestAnimationFrame((t) => update(t));
        }

        setState((prev) => ({ ...prev, updating: false }));
    };

    const pause = () => {
        if (state.paused) {
            return;
        }

        setState((prev) => ({ ...prev, paused: true }));
    };

    const run = () => {
        if (!state.paused) {
            return;
        }

        setState((prev) => ({ ...prev, paused: false }));

        requestAnimationFrame((t) => update(t));
    };

    const initDemo = (demo) => {
        if (!demo?.getProps) {
            setState((prev) => ({
                ...prev,
                ...initialState,
                demo,
            }));

            return;
        }

        const props = demo.getProps();
        setState((prev) => ({
            ...prev,
            ...props,
            demo,
        }));
    };


    const start = () => {
        const st = getState();
        const { demo } = st;

        if (st.useField) {
            fieldRef.current = new Field(canvasHandlerRef.current, state.initialScale, state.timeStep);
            fieldRef.current.useWebGL = st.useWebGL;
        }

        const view = {
            field: fieldRef.current,
            canvas: canvasHandlerRef.current,
            setScaleStep: (scaleStep) => setState((prev) => ({ ...prev, scaleStep })),
        };

        if (demo) {
            if (demo.init) {
                demo.init(view);
            } else {
                demo(view);
            }
        }

        if (st.useField) {
            fieldRef.current.drawFrame();
        }

        if (st.useField && st.autoStart) {
            run();
        }
    };

    const processRotation = (a, b, g, pb) => {
        setState((prev) => ({ ...prev, rotating: true }));

        const st = getState();

        if (st.updating) {
            setTimeout(() => processRotation(a, b, g, pb), 10);
        }

        if (st.useWebGL) {
            const canvasElem = canvasRef.current;
            canvasHandlerRef.current?.setMatrix(
                [canvasElem.clientWidth, canvasElem.clientHeight, st.depth],
                [canvasElem.clientWidth / 2, canvasElem.clientHeight / 2, 0],
                [st.rotation.alpha, st.rotation.beta, st.rotation.gamma],
                [1, 1, 1],
            );
        } else {
            fieldRef.current.rotate(a, b, g);
        }

        fieldRef.current.drawFrame();

        if (!pb) {
            run();
        }

        setState((prev) => ({ ...prev, rotating: false }));
    };

    const onMouseDown = (e) => {
        const st = getState();
        if (st.dragging) {
            return;
        }

        const startPoint = getEventPageCoordinates(e);

        setState((prev) => ({
            ...prev,
            startPoint,
            dragging: true,
        }));
    };

    const onMouseMove = (e) => {
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

        setState((prev) => ({
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
        setState((prev) => ({
            ...prev,
            dragging: false,
            startPoint: null,
        }));
    };

    const onChangeDemo = (e) => {
        const id = e.target.value;
        const demoItem = findDemoById(id);

        let demo;
        if (demoItem.type === 'canvas') {
            const DemoClass = demoItem.init;
            demo = new DemoClass();
        } else if (demoItem.type === 'field') {
            demo = demoItem.init;
        }

        setState((prev) => ({
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

    const onScale = (e) => {
        const scaleFactor = parseFloat(e.target.value);

        setState((prev) => ({ ...prev, scaleFactor }));
        fieldRef.current.setScaleFactor(scaleFactor);
    };

    const onXRotate = (e) => {
        const st = getState();

        const pausedBefore = st.paused;
        pause();

        const val = parseFloat(e.target.value);
        const delta = val - st.rotation.alpha;

        setState((prev) => ({
            ...prev,
            rotation: {
                ...prev.rotation,
                alpha: val,
            },
        }));

        processRotation(delta, 0, 0, pausedBefore);
    };

    const onYRotate = (e) => {
        const st = getState();
        const pausedBefore = st.paused;
        pause();

        const val = parseFloat(e.target.value);
        const delta = val - st.rotation.beta;

        setState((prev) => ({
            ...prev,
            rotation: {
                ...prev.rotation,
                beta: val,
            },
        }));

        processRotation(0, delta, 0, pausedBefore);
    };

    const onZRotate = (e) => {
        const st = getState();
        const pausedBefore = st.paused;
        pause();

        const val = parseFloat(e.target.value);
        const delta = val - st.rotation.gamma;

        setState((prev) => ({
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
    }, [canvasRef.current]);

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
