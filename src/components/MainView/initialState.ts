import { AppState } from 'src/types.ts';

export const defaultProps = {
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

export const initialState: AppState = {
    ...defaultProps,
    paused: true,
    pausedBefore: true,
    settingsVisible: false,
    updating: false,
    rotating: false,
    rotation: { alpha: 0, beta: 0, gamma: 0 },
    timestamp: 0,
    perfValue: 0,
    width: 0,
    height: 0,
    dragging: false,
    startPoint: null,
    prevPoint: null,
};

export const getInitialState = (props = {}, defProps = defaultProps) => ({
    ...props,
    ...defProps,
    ...initialState,
});
