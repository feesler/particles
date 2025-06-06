import {
    DropDownSelectionParam,
    Offcanvas,
    useStore,
} from '@jezvejs/react';
import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
} from 'react';

import { changeZoom, pause } from 'src/store/actions.ts';
import { actions } from 'src/store/reducer.ts';

import {
    INITIAL_SCENE_MARGIN_RATIO,
    ROTATION_SPEED,
    WHEEL_ZOOM_STEP,
} from '../../constants.ts';
import { Field } from '../../engine/Field/Field.ts';
import {
    AppState,
    Canvas,
    Point,
    View,
} from '../../types.ts';
import {
    getEventPageCoordinates,
    getMiddlePoint,
    getPointsDistance,
    getTouchPageCoordinates,
} from '../../utils.ts';

import { Canvas2D, Canvas2DRef } from '../Canvas2D/Canvas2D.tsx';
import { CanvasWebGL, CanvasWebGLRef } from '../CanvasWebGL/CanvasWebGL.tsx';
import { SettingsPanel } from '../SettingsPanel/SettingsPanel.tsx';
import { Toolbar } from '../Toolbar/Toolbar.tsx';

import {
    DemoClass,
    DemoItemFunc,
    demosList,
    findDemoById,
    initialDemoItem,
} from '../../demos/index.ts';

import { defaultProps } from './initialState.ts';

export const MainView = () => {
    const { state, getState, dispatch } = useStore<AppState>();

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
        if (st.rotating || st.paused || st.updating) {
            return;
        }

        dispatch(actions.setUpdating(true));
        const pBefore = performance.now();

        const dt = (st.timestamp) ? (timestamp - st.timestamp) : 0;
        dispatch(actions.setTimestamp(timestamp));

        field.calculate(dt);
        field.drawFrame();
        if (st.scaleStep !== 0) {
            dispatch(actions.stepScaleFactor());

            st = getState();
            field.setScaleFactor(st.scaleFactor);
        }
        processRotationStep();

        const perfValue = Math.round(performance.now() - pBefore);
        dispatch(actions.setPerformance(perfValue));

        if (!st.paused) {
            scheduleUpdate();
        }

        dispatch(actions.setUpdating(false));
    };

    const run = () => {
        const st = getState();
        if (!st.paused) {
            return;
        }

        dispatch(actions.run());
        scheduleUpdate();
    };

    const initDemo = (demo: DemoClass | DemoItemFunc, demoId: string) => {
        dispatch(actions.initDemo({
            props: (typeof demo === 'function') ? defaultProps : demo.getProps(),
            demo,
            demoId,
        }));
    };

    const setScaleStep = (scaleStep: number) => {
        dispatch(actions.setScaleStep(scaleStep));
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
                drawPath: st.drawPath,
                pathLength: st.pathLength,
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

        dispatch(actions.setRotating(true));

        const canvas = getCanvas();
        if (st.useWebGL && canvas?.elem) {
            const webGLCanvas = canvas as CanvasWebGLRef;
            webGLCanvas?.setMatrix(
                [st.canvasWidth, st.canvasHeight, st.depth],
                [st.translation.x, st.translation.y, 0],
                [st.rotation.alpha, st.rotation.beta, st.rotation.gamma],
                [st.zoom, st.zoom, st.zoom],
            );
        } else if (!st.useWebGL) {
            fieldRef.current?.rotate(a, b, g);
        }

        fieldRef.current?.drawFrame();

        dispatch(actions.setRotating(false));
    };

    const onMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
        dispatch(actions.mouseDown(e));
    };

    const onTouchStart = (e: React.TouchEvent) => {
        dispatch(actions.touchStart(e));
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
        dispatch(actions.setPrevTouches(newTouches));

        const prevMiddle = getMiddlePoint(st.prevTouches ?? []);
        const newMiddle = getMiddlePoint(newTouches);
        if (prevMiddle && newMiddle) {
            handleTranslateByPoint(prevMiddle, newMiddle);
        }

        const prevDistance = getPointsDistance(st.prevTouches ?? []);
        if (prevDistance === 0) {
            return;
        }

        const newDistance = getPointsDistance(newTouches);
        const distanceRatio = newDistance / prevDistance;

        onZoom(st.zoom * distanceRatio);
    };

    const handleTranslateByPoint = (prevPoint: Point, newPoint: Point) => {
        if (!newPoint || !prevPoint) {
            return;
        }

        const st = getState();
        const { pausedBefore } = st;
        const x = (newPoint.x - prevPoint.x);
        const y = (newPoint.y - prevPoint.y);

        dispatch(pause());

        dispatch(actions.setPrevPoint(newPoint));
        dispatch(actions.addTranslation({ x, y }));

        processRotation(0, 0, 0);

        if (!pausedBefore) {
            run();
        }
    };

    const handleRotateByPoint = (prevPoint: Point, newPoint: Point) => {
        const st = getState();
        if (!newPoint || !prevPoint) {
            return;
        }

        const { pausedBefore } = st;
        const containerSize = Math.min(st.canvasWidth, st.canvasHeight);
        const deltaX = (prevPoint.x - newPoint.x) / containerSize;
        const deltaY = (prevPoint.y - newPoint.y) / containerSize;
        const beta = Math.PI * deltaX * ROTATION_SPEED;
        const alpha = Math.PI * deltaY * ROTATION_SPEED;

        dispatch(pause());

        dispatch(actions.setPrevPoint(newPoint));
        dispatch(actions.addRotation({ alpha, beta }));

        processRotation(alpha, beta, 0);

        if (!pausedBefore) {
            run();
        }
    };

    const onMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
        const st = getState();
        const { dragging, startPoint } = st;
        if (!dragging || !startPoint || st.canvasWidth === 0 || st.canvasHeight === 0) {
            return;
        }

        const newPoint = getEventPageCoordinates(e);
        const prevPoint = st.prevPoint ?? st.startPoint;
        if (!newPoint || !prevPoint) {
            return;
        }

        if (e.type === 'mousemove' && !e.ctrlKey) {
            handleTranslateByPoint(prevPoint, newPoint);
            return;
        }

        handleRotateByPoint(prevPoint, newPoint);
    };

    const onMouseUp = () => {
        const st = getState();
        const { pausedBefore } = st;

        dispatch(actions.resetTouchDrag());

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

        dispatch(pause());

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

        dispatch(actions.resetDemo());

        fitToScreen();

        initDemo(demo, id);

        requestAnimationFrame(() => {
            start();
        });
    };

    const processRotationStep = () => {
        const st = getState();
        const { paused } = st;
        const { alpha, beta, gamma } = st.rotationStep;
        if (alpha === 0 && beta === 0 && gamma === 0) {
            return;
        }

        dispatch(pause());
        dispatch(actions.stepRotation());

        processRotation(alpha, beta, gamma);

        if (!paused) {
            run();
        }
    };

    const onZoom = (value: number) => {
        dispatch(changeZoom(value, viewAPI));
    };

    useEffect(() => {
        fieldRef.current?.setZoom(state.zoom);
        fieldRef.current?.drawFrame();
    }, [state.zoom]);

    useEffect(() => {
        fieldRef.current?.setGScale(state.gScale);
    }, [state.gScale]);

    useEffect(() => {
        fieldRef.current?.setKScale(state.kScale);
    }, [state.kScale]);

    useEffect(() => {
        fieldRef.current?.setTimeStep(10 ** state.timeStep);
    }, [state.timeStep]);

    useEffect(() => {
        fieldRef.current?.setScaleFactor(state.scaleFactor);
    }, [state.scaleFactor]);

    useEffect(() => {
        fieldRef.current?.setDrawPath(state.drawPath);
    }, [state.drawPath]);

    useEffect(() => {
        fieldRef.current?.setPathLength(state.pathLength);
    }, [state.pathLength]);

    const onToggleRun = () => {
        if (state.paused) {
            run();
        } else {
            dispatch(pause());
        }
    };

    const onReset = () => {
        const st = getState();
        if (!st.demoId) {
            return;
        }

        const demoItem = findDemoById(st.demoId);
        if (!demoItem) {
            return;
        }

        onChangeDemo({
            id: demoItem.id,
            value: demoItem.title ?? '',
        });
    };

    const mainRef = useRef<HTMLElement | null>(null);

    /**
     * Changes zoom to fit the entire scene on the screen
     */
    const fitToScreen = () => {
        const st = getState();
        const canvasSize = Math.min(st.canvasWidth, st.canvasHeight);
        const sceneSize = Math.max(st.width, st.height, st.depth);

        const notResized = canvasSize === 0;
        dispatch(actions.requestFitToScreen(notResized));

        if (notResized) {
            return;
        }

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
        dispatch(pause());

        if (canvasHeight > 0) {
            canvasHeight -= 1;
        }

        dispatch(actions.setCanvasSize({ canvasWidth, canvasHeight }));

        if (st.fitToScreenRequested) {
            fitToScreen();
        }

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

        if (!initialDemoItem?.id) {
            return;
        }

        onChangeDemo({
            id: initialDemoItem.id,
            value: initialDemoItem.title ?? '',
        });
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
        dispatch(actions.showOffcanvas(false));
    }, []);

    const viewAPI = useMemo(() => ({
        scheduleUpdate,
        processRotation,
    }), []);

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
                    onToggleRun={onToggleRun}
                    viewAPI={viewAPI}
                />
            </Offcanvas>
        </div>
    );
};
