import { Button, Offcanvas, useStore } from '@jezvejs/react';
import { ChangeEvent, useEffect, useMemo, useRef } from 'react';

import { Field } from '../../engine/Field.ts';
import { getEventPageCoordinates, mapItems } from '../../utils.ts';
import { usePortalElement } from '../../utils/usePortalElement.tsx';
import { AppState, Canvas, View } from '../../types.ts';

import { Canvas2D, Canvas2DRef } from '../Canvas2D/Canvas2D.tsx';
import { CanvasWebGL, CanvasWebGLRef } from '../CanvasWebGL/CanvasWebGL.tsx';

import { DemoClass, DemoItemFunc, demos, findDemoById } from '../../demos.ts';

import { defaultProps } from './initialState.ts';
import { SettingsPanel } from '../SettingsPanel/SettingsPanel.tsx';

const demosList = mapItems(demos, (item) => ({
    ...item,
    title: item.id,
    type: (['field', 'canvas'].includes(item.type)) ? 'button' : item.type,
}));

export const MainView = () => {
    const { state, getState, setState } = useStore<AppState>();

    const rotationTimeout = useRef<number>(0);
    const fieldRef = useRef<Field | null>(null);
    const canvas2DRef = useRef<Canvas2DRef | null>(null);
    const canvasWebGlRef = useRef<CanvasWebGLRef | null>(null);

    const getCanvas = () => {
        const st = getState();
        return (st.useField && st.useWebGL) ? canvasWebGlRef.current : canvas2DRef.current;
    };

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
        const st = getState();
        if (st.paused) {
            return;
        }

        setState((prev: AppState) => ({ ...prev, paused: true }));
    };

    const run = () => {
        const st = getState();
        if (!st.paused) {
            return;
        }

        setState((prev: AppState) => ({ ...prev, paused: false }));

        requestAnimationFrame((t) => update(t));
    };

    const initDemo = (demo: DemoClass | DemoItemFunc) => {
        if (typeof demo === 'function') {
            setState((prev: AppState) => ({
                ...prev,
                ...defaultProps,
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

        const canvas = getCanvas() as Canvas;
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

    const scheduleRotation = (func: () => void) => {
        if (rotationTimeout.current) {
            clearTimeout(rotationTimeout.current);
        }

        rotationTimeout.current = setTimeout(func, 10);
    };

    const processRotation = (a: number, b: number, g: number) => {
        const st = getState();
        if (st.updating) {
            scheduleRotation(() => processRotation(a, b, g));
            return;
        }

        setState((prev: AppState) => ({ ...prev, rotating: true }));

        const canvas = getCanvas();
        if (st.useWebGL && canvas?.elem) {
            const { clientWidth, clientHeight } = canvas.elem;

            const webGLCanvas = canvas as CanvasWebGLRef;
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
            prevPoint: null,
            dragging: true,
            pausedBefore: prev.paused,
        }));
    };

    const onMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
        const st = getState();
        const { dragging, startPoint } = st;
        const canvas = getCanvas();
        if (!dragging || !startPoint || !canvas) {
            return;
        }

        const newPoint = getEventPageCoordinates(e);
        const prevPoint = st.prevPoint ?? st.startPoint;
        if (!newPoint || !prevPoint || !canvas.elem) {
            return;
        }

        const rect = canvas.elem.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) {
            return;
        }

        const containerSize = Math.min(rect.width, rect.height);
        const deltaX = (prevPoint.x - newPoint.x) / containerSize;
        const deltaY = (prevPoint.y - newPoint.y) / containerSize;

        const beta = Math.PI * deltaX;
        const alpha = Math.PI * deltaY;

        pause();

        setState((prev: AppState) => ({
            ...prev,
            prevPoint: { ...newPoint },
            rotation: {
                alpha: prev.rotation.alpha + alpha,
                beta: prev.rotation.beta + beta,
                gamma: 0,
            },
        }));

        processRotation(alpha, beta, 0);
    };

    const onMouseUp = () => {
        const st = getState();
        const { pausedBefore } = st;

        setState((prev: AppState) => ({
            ...prev,
            dragging: false,
            startPoint: null,
        }));

        if (!pausedBefore) {
            run();
        }
    };

    const clearDemo = () => {
        const st = getState();
        if (st.demo && ('clear' in st.demo) && st.demo.clear) {
            st.demo.clear();
        }
    };

    const onChangeDemo = (e: ChangeEvent<HTMLSelectElement>) => {
        const id = e.target.value;
        const demoItem = findDemoById(id);
        if (!demoItem) {
            return;
        }

        clearDemo();

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
            demo: null,
        }));

        initDemo(demo);

        requestAnimationFrame(() => {
            start();
        });
    };

    const showOffcanvas = (settingsVisible: boolean) => {
        setState((prev) => ({ ...prev, settingsVisible }));
    };

    const onScale = (e: ChangeEvent<HTMLInputElement>) => {
        const scaleFactor = parseFloat(e.target.value);

        setState((prev: AppState) => ({ ...prev, scaleFactor }));
        fieldRef.current?.setScaleFactor(scaleFactor);
    };

    const onXRotate = (e: ChangeEvent<HTMLInputElement>) => {
        const st = getState();

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

        processRotation(delta, 0, 0);
    };

    const onYRotate = (e: ChangeEvent<HTMLInputElement>) => {
        const st = getState();

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

        processRotation(0, delta, 0);
    };

    const onZRotate = (e: ChangeEvent<HTMLInputElement>) => {
        const st = getState();

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

        processRotation(0, 0, delta);
    };

    const onToggleRun = () => {
        if (state.paused) {
            run();
        } else {
            pause();
        }
    };

    const mainRef = useRef<HTMLElement | null>(null);

    const resizeHandler = () => {
        const st = getState();
        const rect = mainRef.current?.getBoundingClientRect() ?? null;
        if (!rect) {
            return;
        }

        const { width } = rect;
        let { height } = rect;
        if (
            width === 0
            || height === 0
            || (st.width === width && st.height === height)
        ) {
            return;
        }

        const pausedBefore = st.paused;
        pause();

        if (height > 0) {
            height -= 1;
        }

        setState((prev: AppState) => ({
            ...prev,
            width,
            height,
        }));

        fieldRef.current?.onResize?.({ width, height });

        if (!pausedBefore) {
            run();
        }
    };

    // ResizeObserver
    useEffect(() => {
        if (!mainRef.current) {
            return undefined;
        }

        const observer = new ResizeObserver(resizeHandler);
        observer.observe(mainRef.current);

        return () => {
            observer.disconnect();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mainRef.current]);

    useEffect(() => {
        start();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const lstate = getState();

    const canvasProps = useMemo(() => ({
        width: lstate.width,
        height: lstate.height,
        onTouchStart: onMouseDown,
        onTouchMove: onMouseMove,
        onTouchEnd: onMouseUp,
        onMouseDown,
        onMouseMove,
        onMouseUp,
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }), [lstate.width, lstate.height]);

    const canvas = (lstate.useField /* && lstate.useWebGL */)
        ? (<CanvasWebGL {...canvasProps} ref={canvasWebGlRef} />)
        : (<Canvas2D {...canvasProps} ref={canvas2DRef} />);

    const portalElement = usePortalElement('maincontainer') as Element;

    return (
        <div id="maincontainer" className="container">
            <main className="main-container" ref={mainRef}>
                {canvas}
            </main>

            <Button
                className="header-btn"
                onClick={() => showOffcanvas(true)}
            >Show</Button>

            <Offcanvas
                placement="right"
                closed={!lstate.settingsVisible}
                onClosed={() => showOffcanvas(false)}
                container={portalElement}
            >
                <SettingsPanel
                    fieldRef={fieldRef.current}
                    demosList={demosList}
                    onChangeDemo={onChangeDemo}
                    onClose={() => showOffcanvas(false)}
                    onScale={onScale}
                    onXRotate={onXRotate}
                    onYRotate={onYRotate}
                    onZRotate={onZRotate}
                    onToggleRun={onToggleRun}
                />
            </Offcanvas>
        </div>
    );
};
