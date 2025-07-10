import { useStore } from '@jezvejs/react';
import {
    createContext,
    ReactNode,
    useContext,
    useMemo,
    useRef,
} from 'react';
import { Canvas2DRef } from 'components/Canvas2D/Canvas2D.tsx';
import { CanvasWebGLRef } from 'components/CanvasWebGL/CanvasWebGL.tsx';

import { Field } from 'engine/Field/Field.ts';
import { pause, run } from 'store/actions.ts';
import { actions } from 'store/reducer.ts';
import { AppState } from 'shared/types.ts';

export interface AppContext {
    fieldRef: React.MutableRefObject<Field | null>;

    canvas2DRef: React.MutableRefObject<Canvas2DRef>;
    canvasWebGlRef: React.MutableRefObject<CanvasWebGLRef>;

    isUseWebGL: () => boolean;
    getCanvasRef: () => React.MutableRefObject<Canvas2DRef | CanvasWebGLRef>;
    getCanvas: () => Canvas2DRef | CanvasWebGLRef | null;

    scheduleUpdate: () => void;
    processRotation: (a: number, b: number, g: number) => void;
}

export interface AppContextProviderProps {
    children: ReactNode;
}

export const initialContext: AppContext = {
    fieldRef: { current: null },

    canvas2DRef: { current: null },
    canvasWebGlRef: { current: null },

    isUseWebGL: () => false,
    getCanvasRef: () => ({ current: null }),
    getCanvas: () => null,

    scheduleUpdate: () => { },
    processRotation: () => { },
};

const AppContext = createContext<AppContext>(initialContext);

export function useAppContext(): AppContext {
    return useContext(AppContext);
}

export function AppContextProvider(
    props: AppContextProviderProps,
) {
    const {
        children,
    } = props;

    const { getState, dispatch } = useStore<AppState>();

    const updateTimeout = useRef<number>(0);
    const rotationTimeout = useRef<number>(0);

    const fieldRef = useRef<Field | null>(null);

    const canvas2DRef = useRef<Canvas2DRef>(null);
    const canvasWebGlRef = useRef<CanvasWebGLRef>(null);

    const isUseWebGL = () => {
        const st = getState();
        return !!(st.useField && st.useWebGL);
    };

    const getCanvasRef = () => (
        isUseWebGL() ? canvasWebGlRef : canvas2DRef
    );

    const getCanvas = () => {
        const ref = getCanvasRef();
        return ref.current;
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
            dispatch(run(contextValue));
        }
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

    const contextValue = useMemo(() => ({
        fieldRef,
        canvas2DRef,
        canvasWebGlRef,
        isUseWebGL,
        getCanvasRef,
        getCanvas,
        scheduleUpdate,
        processRotation,
    }), [fieldRef]);

    return (
        <AppContext.Provider value={contextValue}>
            {children}
        </AppContext.Provider>
    );
}
