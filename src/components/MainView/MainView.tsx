import {
    DropDownSelectionParam,
    MenuItemProps,
    MenuItemType,
    minmax,
    Offcanvas,
    useStore,
} from '@jezvejs/react';
import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
} from 'react';

import {
    INITIAL_SCENE_MARGIN_RATIO,
    MAX_ZOOM,
    MIN_ZOOM,
    WHEEL_ZOOM_STEP,
} from '../../constants.ts';
import { Field } from '../../engine/Field/Field.ts';
import {
    getEventPageCoordinates,
    getPointsDistance,
    getTouchPageCoordinates,
    mapItems,
} from '../../utils.ts';
import {
    AppState,
    Canvas,
    Point,
    View,
} from '../../types.ts';

import { Canvas2D, Canvas2DRef } from '../Canvas2D/Canvas2D.tsx';
import { CanvasWebGL, CanvasWebGLRef } from '../CanvasWebGL/CanvasWebGL.tsx';
import { SettingsPanel } from '../SettingsPanel/SettingsPanel.tsx';
import { Toolbar } from '../Toolbar/Toolbar.tsx';

import {
    DemoClass,
    DemoItem,
    DemoItemFunc,
    demos,
    findDemoById,
} from '../../demos/index.ts';

import { defaultProps } from './initialState.ts';

const demosList = mapItems<DemoItem, MenuItemProps>(demos, ({ type, ...item }) => ({
    id: item.id,
    title: item.id,
    type: ((type === 'group') ? 'group' : 'button') as MenuItemType,
    items: item.items as MenuItemProps[],
}));

export const MainView = () => {
    const { state, getState, setState } = useStore<AppState>();

    const updateTimeout = useRef<number>(0);
    const rotationTimeout = useRef<number>(0);
    const fieldRef = useRef<Field | null>(null);
    const canvas2DRef = useRef<Canvas2DRef | null>(null);
    const canvasWebGlRef = useRef<CanvasWebGLRef | null>(null);

    const getCanvas = () => {
        const st = getState();
        return (st.useField && st.useWebGL) ? canvasWebGlRef.current : canvas2DRef.current;
    };

    const scheduleUpdate = () => {
        if (updateTimeout.current) {
            clearTimeout(updateTimeout.current);
        }

        updateTimeout.current = setTimeout(() => {
            updateTimeout.current = 0;
            requestAnimationFrame((t) => update(t));
        }, 10);
    };

    const update = (timestamp: number) => {
        const field = fieldRef.current;
        if (!field) {
            return;
        }

        let st = getState();
        if (st.rotating || st.paused) {
            return;
        }

        setState((prev: AppState) => ({ ...prev, updating: true }));
        const pBefore = performance.now();

        const dt = (st.timestamp) ? (timestamp - st.timestamp) : 0;
        setState((prev: AppState) => ({ ...prev, timestamp }));

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
        processRotationStep();

        const perfValue = Math.round(performance.now() - pBefore);
        setState((prev: AppState) => ({ ...prev, perfValue }));

        if (!st.paused) {
            scheduleUpdate();
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
        scheduleUpdate();
    };

    const initDemo = (demo: DemoClass | DemoItemFunc, demoId: string) => {
        if (typeof demo === 'function') {
            setState((prev: AppState) => ({
                ...prev,
                ...defaultProps,
                demo,
                demoId,
            }));

            return;
        }

        const props = demo.getProps();
        setState((prev: AppState) => ({
            ...prev,
            ...props,
            demo,
            demoId,
        }));
    };

    const setScaleStep = (scaleStep: number) => {
        setState((prev: AppState) => ({ ...prev, scaleStep }));
    };

    const start = () => {
        const st = getState();
        const { demo } = st;

        const canvas = getCanvas() as Canvas;
        if (!canvas) {
            return;
        }

        if (st.useField) {
            const fieldProps = {
                canvas,
                useWebGL: st.useWebGL,
                width: st.width,
                height: st.height,
                depth: st.depth,
                scaleFactor: st.initialScale,
                timeStep: st.timeStep,
            };

            fieldRef.current = new Field(fieldProps);
        }

        const view: View = {
            field: fieldRef.current,
            canvas,
            setScaleStep,
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
                [st.zoom, st.zoom, st.zoom],
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

    const onTouchStart = (e: React.TouchEvent) => {
        if (e.touches.length === 1) {
            onMouseDown(e);
            return;
        }

        const touches = getTouchPageCoordinates(e);
        setState((prev: AppState) => ({
            ...prev,
            prevTouches: touches,
            dragging: true,
            pausedBefore: prev.paused,
        }));
    };

    const setPrevTouches = (prevTouches: Point[] | null) => {
        setState((prev: AppState) => ({
            ...prev,
            prevTouches,
            dragging: true,
            pausedBefore: prev.paused,
        }));
    };

    const onTouchMove = (e: React.TouchEvent) => {
        if (e.touches.length === 1) {
            onMouseMove(e);
            return;
        }

        if (e.cancelable) {
            e.preventDefault();
        }

        const st = getState();
        const newTouches = getTouchPageCoordinates(e);
        setPrevTouches(newTouches);

        const prevDistance = getPointsDistance(st.prevTouches ?? []);
        if (prevDistance === 0) {
            return;
        }

        const newDistance = getPointsDistance(newTouches);
        const distanceRatio = newDistance / prevDistance;

        onZoom(st.zoom * distanceRatio);
    };

    const onMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
        const st = getState();
        const { dragging, startPoint, pausedBefore } = st;
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

        const rotationSpeed = 0.75;
        const beta = Math.PI * deltaX * rotationSpeed;
        const alpha = Math.PI * deltaY * rotationSpeed;

        pause();

        setState((prev: AppState) => ({
            ...prev,
            prevPoint: { ...newPoint },
            rotation: {
                ...prev.rotation,
                alpha: prev.rotation.alpha + alpha,
                beta: prev.rotation.beta + beta,
            },
        }));

        processRotation(alpha, beta, 0);

        if (!pausedBefore) {
            run();
        }
    };

    const onMouseUp = () => {
        const st = getState();
        const { pausedBefore } = st;

        setState((prev: AppState) => ({
            ...prev,
            dragging: false,
            startPoint: null,
            prevTouches: null,
        }));

        if (!pausedBefore) {
            run();
        }
    };

    const onWheel = (e: React.WheelEvent) => {
        const st = getState();
        const step = WHEEL_ZOOM_STEP / ((e.altKey) ? 10 : 1);
        const zoomDelta = (e.deltaY / 100) * step;

        onZoom(st.zoom - zoomDelta);
    };

    const clearDemo = () => {
        const st = getState();
        if (st.demo && ('clear' in st.demo) && st.demo.clear) {
            st.demo.clear();
        }
    };

    const onChangeDemo = (selected: DropDownSelectionParam) => {
        if (Array.isArray(selected) || selected === null) {
            return;
        }

        const id = selected?.id;
        const demoItem = findDemoById(id);
        if (!demoItem) {
            return;
        }

        pause();

        clearDemo();

        let demo;
        if (demoItem.type === 'canvas') {
            const DemoItemClass = demoItem.demo;
            if (!DemoItemClass) {
                return;
            }

            demo = new DemoItemClass();
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
            demoId: null,
        }));

        fitToScreen();

        initDemo(demo, id);

        requestAnimationFrame(() => {
            start();
        });
    };

    const showOffcanvas = (settingsVisible: boolean) => {
        setState((prev) => ({ ...prev, settingsVisible }));
    };

    const onScale = (value: number) => {
        const scaleFactor = value;

        setState((prev: AppState) => ({ ...prev, scaleFactor }));
        fieldRef.current?.setScaleFactor(scaleFactor);
    };

    const onChangeScaleStep = (value: number) => {
        setScaleStep(value);
    };

    const onChangeTimeStep = (value: number) => {
        const timeStepScale = value;
        const timeStep = 10 ** timeStepScale;

        setState((prev: AppState) => ({ ...prev, timeStep: timeStepScale }));
        fieldRef.current?.setTimeStep(timeStep);
    };

    const onXRotate = (value: number) => {
        const st = getState();
        const { paused } = st;

        pause();

        const val = value;
        const delta = val - st.rotation.alpha;

        setState((prev: AppState) => ({
            ...prev,
            rotation: {
                ...prev.rotation,
                alpha: val,
            },
        }));

        processRotation(delta, 0, 0);

        if (!paused) {
            run();
        }
    };

    const onYRotate = (value: number) => {
        const st = getState();
        const { paused } = st;

        pause();

        const val = value;
        const delta = val - st.rotation.beta;

        setState((prev: AppState) => ({
            ...prev,
            rotation: {
                ...prev.rotation,
                beta: val,
            },
        }));

        processRotation(0, delta, 0);

        if (!paused) {
            run();
        }
    };

    const onZRotate = (value: number) => {
        const st = getState();
        const { paused } = st;

        pause();

        const val = value;
        const delta = val - st.rotation.gamma;

        setState((prev: AppState) => ({
            ...prev,
            rotation: {
                ...prev.rotation,
                gamma: val,
            },
        }));

        processRotation(0, 0, delta);

        if (!paused) {
            run();
        }
    };

    const onChangeXRotationStep = (alpha: number) => {
        setState((prev: AppState) => ({
            ...prev,
            rotationStep: {
                ...prev.rotationStep,
                alpha,
            },
        }));
    };

    const onChangeYRotationStep = (beta: number) => {
        setState((prev: AppState) => ({
            ...prev,
            rotationStep: {
                ...prev.rotationStep,
                beta,
            },
        }));
    };

    const onChangeZRotationStep = (gamma: number) => {
        setState((prev: AppState) => ({
            ...prev,
            rotationStep: {
                ...prev.rotationStep,
                gamma,
            },
        }));
    };

    const processRotationStep = () => {
        const st = getState();
        const { paused } = st;
        const { alpha, beta, gamma } = st.rotationStep;
        if (alpha === 0 && beta === 0 && gamma === 0) {
            return;
        }

        pause();

        setState((prev: AppState) => ({
            ...prev,
            rotation: {
                alpha: prev.rotation.alpha + alpha,
                beta: prev.rotation.beta + beta,
                gamma: prev.rotation.gamma + gamma,
            },
        }));

        processRotation(alpha, beta, gamma);

        if (!paused) {
            run();
        }
    };

    const onZoom = (value: number) => {
        const st = getState();
        const { paused } = st;

        const zoom = minmax(MIN_ZOOM, MAX_ZOOM, value);
        if (zoom === st.zoom) {
            return;
        }

        pause();

        setState((prev: AppState) => ({ ...prev, zoom }));

        fieldRef.current?.setZoom(zoom);
        fieldRef.current?.drawFrame();

        processRotation(0, 0, 0);

        if (!paused) {
            run();
        }
    };

    const onChangeGScale = (value: number) => {
        const st = getState();
        const { paused } = st;

        pause();

        const gScale = value;
        setState((prev: AppState) => ({ ...prev, gScale }));

        fieldRef.current?.setGScale(gScale);

        if (!paused) {
            run();
        }
    };

    const onChangeKScale = (value: number) => {
        const st = getState();
        const { paused } = st;

        pause();

        const kScale = value;
        setState((prev: AppState) => ({ ...prev, kScale }));

        fieldRef.current?.setKScale(kScale);

        if (!paused) {
            run();
        }
    };

    const onToggleRun = () => {
        if (state.paused) {
            run();
        } else {
            pause();
        }
    };

    const onReset = () => {
        const st = getState();
        if (!st.demoId) {
            return;
        }

        const currentItem = {
            id: st.demoId,
            value: st.demoId,
        };

        onChangeDemo(currentItem);
    };

    const mainRef = useRef<HTMLElement | null>(null);

    /**
     * Changes zoom to fit the entire scene on the screen
     */
    const fitToScreen = () => {
        const st = getState();
        const canvasSize = Math.min(st.canvasWidth, st.canvasHeight);
        const sceneSize = Math.max(st.width, st.height, st.depth);
        const sceneMargin = sceneSize * INITIAL_SCENE_MARGIN_RATIO;
        const newZoom = canvasSize / (sceneSize + sceneMargin);
        onZoom(newZoom);
    };

    const resizeHandler = () => {
        const st = getState();
        const rect = mainRef.current?.getBoundingClientRect() ?? null;
        if (!rect) {
            return;
        }

        const canvasWidth = rect.width;
        let canvasHeight = rect.height;
        if (
            canvasWidth === 0
            || canvasHeight === 0
            || (st.canvasWidth === canvasWidth && st.canvasHeight === canvasHeight)
        ) {
            return;
        }

        const pausedBefore = st.paused;
        pause();

        if (canvasHeight > 0) {
            canvasHeight -= 1;
        }

        setState((prev: AppState) => ({
            ...prev,
            canvasWidth,
            canvasHeight,
        }));

        setTimeout(() => {
            fieldRef.current?.drawFrame();
        }, 10);

        processRotation(0, 0, 0);

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
    }, [mainRef.current]);

    useEffect(() => {
        start();
    }, []);

    const lstate = getState();

    const canvasProps = useMemo(() => ({
        width: lstate.canvasWidth,
        height: lstate.canvasHeight,
        onTouchStart,
        onTouchMove,
        onTouchEnd: onMouseUp,
        onMouseDown,
        onMouseMove,
        onMouseUp,
        onWheel,
        className: 'app-canvas',
    }), [lstate.canvasWidth, lstate.canvasHeight]);

    const canvas = (lstate.useField && lstate.useWebGL)
        ? (<CanvasWebGL {...canvasProps} ref={canvasWebGlRef} />)
        : (<Canvas2D {...canvasProps} ref={canvas2DRef} />);

    const onClose = useCallback(() => {
        showOffcanvas(false);
    }, []);

    return (
        <div id="maincontainer" className="container">
            <main className="main-container" ref={mainRef}>
                {canvas}
            </main>

            <Toolbar onToggleRun={onToggleRun} onReset={onReset} onClose={onClose} />

            <Offcanvas
                className="settings"
                placement="right"
                closed={!lstate.settingsVisible}
                onClosed={onClose}
                usePortal={false}
            >
                <SettingsPanel
                    fieldRef={fieldRef.current}
                    demosList={demosList}
                    onChangeDemo={onChangeDemo}
                    onClose={onClose}
                    onScale={onScale}
                    onChangeScaleStep={onChangeScaleStep}
                    onChangeTimeStep={onChangeTimeStep}
                    onXRotate={onXRotate}
                    onYRotate={onYRotate}
                    onZRotate={onZRotate}
                    onChangeXRotationStep={onChangeXRotationStep}
                    onChangeYRotationStep={onChangeYRotationStep}
                    onChangeZRotationStep={onChangeZRotationStep}
                    onZoom={onZoom}
                    onChangeGScale={onChangeGScale}
                    onChangeKScale={onChangeKScale}
                    onToggleRun={onToggleRun}
                />
            </Offcanvas>
        </div>
    );
};
