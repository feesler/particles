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

export const initialState = {
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
