import { createSlice } from '@jezvejs/react';
import { DemoClass, DemoItemFunc, DemoProps } from 'src/demos/index.ts';
import { AppState, Point, Rotation } from 'src/types.ts';
import { getEventPageCoordinates, getTouchPageCoordinates } from 'src/utils.ts';

const mouseDown = (state: AppState, e: React.MouseEvent | React.TouchEvent): AppState => (
    (state.dragging)
        ? state
        : ({
            ...state,
            startPoint: getEventPageCoordinates(e),
            prevPoint: null,
            dragging: true,
            pausedBefore: state.paused,
        })
);

export interface InitDemoProps {
    props: Partial<DemoProps>;
    demo: DemoClass | DemoItemFunc;
    demoId: string;
}

export interface SetCanvasSizeProps {
    canvasWidth: number;
    canvasHeight: number;
}

// Reducers
const slice = createSlice<AppState>({
    resetDemo: (state: AppState) => ({
        ...state,
        paused: true,
        updating: false,
        rotating: false,
        rotation: { alpha: 0, beta: 0, gamma: 0 },
        timestamp: 0,
        perfValue: 0,
        dragging: false,
        startPoint: null,
        demo: null,
        demoId: null,
    }),

    initDemo: (state: AppState, { props, demo, demoId }: InitDemoProps) => ({
        ...state,
        ...props,
        drawPath: state.drawPath,
        pathLength: state.pathLength,
        demo,
        demoId,
    }),

    requestFitToScreen: (state: AppState, fitToScreenRequested: boolean = true) => ({
        ...state, fitToScreenRequested,
    }),

    setCanvasSize: (
        state: AppState,
        { canvasWidth, canvasHeight }: SetCanvasSizeProps,
    ): AppState => ({
        ...state,
        canvasWidth,
        canvasHeight,
        translation: { x: canvasWidth / 2, y: canvasHeight / 2 },
    }),

    setTimestamp: (state: AppState, timestamp: number): AppState => ({ ...state, timestamp }),

    setPerformance: (state: AppState, perfValue: number): AppState => ({ ...state, perfValue }),

    showOffcanvas: (
        state: AppState,
        settingsVisible: boolean,
    ): AppState => ({
        ...state,
        settingsVisible,
    }),

    setUpdating: (state: AppState, updating: boolean): AppState => ({ ...state, updating }),

    setRotating: (state: AppState, rotating: boolean): AppState => ({ ...state, rotating }),

    pause: (state: AppState): AppState => ({ ...state, paused: true }),

    run: (state: AppState): AppState => ({ ...state, paused: false }),

    mouseDown,

    touchStart: (state: AppState, e: React.TouchEvent) => (
        (e.touches.length === 1)
            ? mouseDown(state, e)
            : ({
                ...state,
                prevTouches: getTouchPageCoordinates(e),
                dragging: true,
                pausedBefore: state.paused,
            })
    ),

    setPrevTouches: (prev: AppState, prevTouches: Point[] | null) => ({
        ...prev,
        prevTouches,
        dragging: true,
        pausedBefore: prev.paused,
    }),

    setPrevPoint: (state: AppState, newPoint: Point) => ({
        ...state,
        prevPoint: { ...newPoint },
    }),

    addTranslation: (state: AppState, { x, y }: Partial<Point>) => ({
        ...state,
        translation: {
            ...state.translation,
            x: state.translation.x + (x ?? 0),
            y: state.translation.y + (y ?? 0),
        },
    }),

    resetTouchDrag: (state: AppState) => ({
        ...state,
        dragging: false,
        startPoint: null,
        prevTouches: null,
    }),

    setZoom: (state: AppState, zoom: number): AppState => ({ ...state, zoom }),

    setTimeStep: (state: AppState, timeStep: number): AppState => ({ ...state, timeStep }),

    // Scale factor
    setScaleFactor: (state: AppState, scaleFactor: number): AppState => ({
        ...state,
        scaleFactor,
    }),

    setScaleStep: (state: AppState, scaleStep: number): AppState => ({ ...state, scaleStep }),

    stepScaleFactor: (state: AppState): AppState => ({
        ...state,
        scaleFactor: state.scaleFactor + state.scaleStep,
    }),

    // Rotation
    toggleRotationCollapsible: (state: AppState): AppState => ({
        ...state,
        rotationSettingsExpanded: !state.rotationSettingsExpanded,
    }),

    addRotation: (state: AppState, { alpha, beta, gamma }: Partial<Rotation>): AppState => ({
        ...state,
        rotation: {
            alpha: state.rotation.alpha + (alpha ?? 0),
            beta: state.rotation.beta + (beta ?? 0),
            gamma: state.rotation.gamma + (gamma ?? 0),
        },
    }),

    stepRotation: (state: AppState): AppState => ({
        ...state,
        rotation: {
            alpha: state.rotation.alpha + state.rotationStep.alpha,
            beta: state.rotation.beta + state.rotationStep.beta,
            gamma: state.rotation.gamma + state.rotationStep.gamma,
        },
    }),

    startRotation: (state: AppState): AppState => ({ ...state, rotating: true }),

    stopRotation: (state: AppState): AppState => ({ ...state, rotating: false }),

    setRotationAlpha: (state: AppState, alpha: number): AppState => ({
        ...state,
        rotation: {
            ...state.rotation,
            alpha,
        },
    }),

    setRotationBeta: (state: AppState, beta: number): AppState => ({
        ...state,
        rotation: {
            ...state.rotation,
            beta,
        },
    }),

    setRotationGamma: (state: AppState, gamma: number): AppState => ({
        ...state,
        rotation: {
            ...state.rotation,
            gamma,
        },
    }),

    // Rotation step
    toggleRotationStepCollapsible: (state: AppState): AppState => ({
        ...state,
        rotationStepSettingsExpanded: !state.rotationStepSettingsExpanded,
    }),

    setRotationStepAlpha: (state: AppState, alpha: number): AppState => ({
        ...state,
        rotationStep: {
            ...state.rotationStep,
            alpha,
        },
    }),

    setRotationStepBeta: (state: AppState, beta: number): AppState => ({
        ...state,
        rotationStep: {
            ...state.rotationStep,
            beta,
        },
    }),

    setRotationStepGamma: (state: AppState, gamma: number): AppState => ({
        ...state,
        rotationStep: {
            ...state.rotationStep,
            gamma,
        },
    }),

    // Drag path
    toggleDragPathCollapsible: (state: AppState): AppState => ({
        ...state,
        drawPathSettingsExpanded: !state.drawPathSettingsExpanded,
    }),

    setDrawPath: (state: AppState, drawPath: boolean): AppState => ({ ...state, drawPath }),

    setDrawPathLength: (state: AppState, pathLength: number): AppState => ({
        ...state,
        pathLength,
    }),

    // Gravity
    setGScale: (state: AppState, gScale: number): AppState => ({ ...state, gScale }),

    // Coulomb force
    setKScale: (state: AppState, kScale: number): AppState => ({ ...state, kScale }),
});

export const { actions, reducer } = slice;
