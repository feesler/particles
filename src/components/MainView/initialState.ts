import { SCENE_SIZE } from 'src/constants.ts';
import { AppState } from 'src/types.ts';

export const defaultProps = {
    autoStart: false,
    animationDelay: 10,
    width: SCENE_SIZE,
    height: SCENE_SIZE,
    depth: SCENE_SIZE,
    initialScale: 0.1,
    timeStep: 0.1,
    scaleFactor: 0,
    scaleStep: 0,
    drawPath: false,
    pathLength: 5,
    useField: true,
    useWebGL: true,
    demo: null,
    demoId: null,
};

export const initialState: AppState = {
    ...defaultProps,
    fitToScreenRequested: false,
    paused: true,
    pausedBefore: true,
    settingsVisible: false,
    rotationSettingsExpanded: false,
    rotationStepSettingsExpanded: false,
    drawPathSettingsExpanded: false,
    updating: false,
    rotating: false,
    translation: { x: 0, y: 0 },
    rotation: { alpha: 0, beta: 0, gamma: 0 },
    rotationStep: { alpha: 0, beta: 0, gamma: 0 },
    timestamp: 0,
    perfValue: 0,
    canvasWidth: 0,
    canvasHeight: 0,
    zoom: 1,
    gScale: -7,
    kScale: 1,
    dragging: false,
    startPoint: null,
    prevPoint: null,
    prevTouches: null,
};

export const getInitialState = (props = {}, defProps = defaultProps) => ({
    ...props,
    ...defProps,
    ...initialState,
});
