import { useStore } from '@jezvejs/react';
import { useEffect, useMemo } from 'react';

import { ROTATION_SPEED, WHEEL_ZOOM_STEP } from 'src/constants.ts';
import { AppState, Point } from 'src/types.ts';

import { useAppContext } from 'src/context/AppContextProvider.tsx';
import {
    changeZoom,
    pause,
    rotateAroundZAxis,
    run,
} from 'src/store/actions.ts';
import { actions } from 'src/store/reducer.ts';

import {
    getAngleBetweenPoints,
    getEventPageCoordinates,
    getMiddlePoint,
    getPointsDistance,
    getTouchPageCoordinates,
} from 'src/utils.ts';

import { Canvas2D } from '../Canvas2D/Canvas2D.tsx';
import { CanvasWebGL } from '../CanvasWebGL/CanvasWebGL.tsx';

export const SceneCanvas = () => {
    const context = useAppContext();
    const { fieldRef, processRotation, isUseWebGL } = context;

    const { getState, dispatch } = useStore<AppState>();

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
        const prevTouches = st.prevTouches ?? [];
        const newTouches = getTouchPageCoordinates(e);
        dispatch(actions.setPrevTouches(newTouches));

        // Translate
        const prevMiddle = getMiddlePoint(prevTouches);
        const newMiddle = getMiddlePoint(newTouches);
        if (prevMiddle && newMiddle) {
            handleTranslateByPoint(prevMiddle, newMiddle);
        }

        // Rotation around z-axis
        const prevAngle = getAngleBetweenPoints(prevTouches);
        const newAngle = getAngleBetweenPoints(newTouches);
        const deltaAngle = (prevAngle && newAngle) ? newAngle - prevAngle : 0;
        if (deltaAngle !== 0) {
            const gamma = st.rotation.gamma + deltaAngle;
            dispatch(rotateAroundZAxis(gamma, context));
        }

        // Zoom
        const prevDistance = getPointsDistance(prevTouches);
        if (prevDistance === 0) {
            return;
        }

        const newDistance = getPointsDistance(newTouches);
        const distanceRatio = newDistance / prevDistance;

        const newZoom = st.zoom * distanceRatio;
        dispatch(changeZoom(newZoom, context));
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
            dispatch(run(context));
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
            dispatch(run(context));
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
            dispatch(run(context));
        }
    };

    const onWheel = (e: React.WheelEvent) => {
        const st = getState();
        const step = WHEEL_ZOOM_STEP / ((e.altKey) ? 10 : 1);
        const zoomDelta = (e.deltaY / 100) * step;

        const newZoom = st.zoom - zoomDelta;

        dispatch(changeZoom(newZoom, context));
    };

    const state = getState();

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

    const canvasProps = useMemo(() => ({
        width: state.canvasWidth,
        height: state.canvasHeight,
        onTouchStart,
        onTouchMove,
        onTouchEnd: onMouseUp,
        onMouseDown,
        onMouseMove,
        onMouseUp,
        onWheel,
        className: 'app-canvas',
    }), [state.canvasWidth, state.canvasHeight]);

    if (isUseWebGL()) {
        return <CanvasWebGL {...canvasProps} ref={context.canvasWebGlRef} />;
    }

    return <Canvas2D {...canvasProps} ref={context.canvas2DRef} />;
};
