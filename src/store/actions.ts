import { minmax, StoreActionAPI, StoreActionFunction } from '@jezvejs/react';
import { MAX_ZOOM, MIN_ZOOM } from 'shared/constants.ts';
import { AppContext } from 'context/AppContextProvider.tsx';
import { AppState } from 'shared/types.ts';
import { actions } from './reducer.ts';

export type MainViewActionsAPI = {
    scheduleUpdate: () => void;
    processRotation: (a: number, b: number, g: number) => void;
};

export const pause = (): StoreActionFunction<AppState> => ({ getState, dispatch }) => {
    const st = getState();
    if (st.paused) {
        return;
    }

    dispatch(actions.pause());
};

export const run = ({ scheduleUpdate }: AppContext) => ({
    getState,
    dispatch,
}: StoreActionAPI<AppState>) => {
    const st = getState();
    if (!st.paused) {
        return;
    }

    dispatch(actions.run());
    scheduleUpdate();
};

export const rotateAroundXAxis = (value: number, context: AppContext) => (
    { getState, dispatch }: StoreActionAPI<AppState>,
) => {
    const st = getState();
    const { paused } = st;
    const { processRotation } = context;

    dispatch(pause());

    const val = value;
    const delta = val - st.rotation.alpha;

    dispatch(actions.setRotationAlpha(value));

    processRotation(delta, 0, 0);

    if (!paused) {
        dispatch(run(context));
    }
};

export const rotateAroundYAxis = (value: number, context: AppContext) => (
    { getState, dispatch }: StoreActionAPI<AppState>,
) => {
    const st = getState();
    const { paused } = st;
    const { processRotation } = context;

    dispatch(pause());

    const delta = value - st.rotation.beta;

    dispatch(actions.setRotationBeta(value));

    processRotation(0, delta, 0);

    if (!paused) {
        dispatch(run(context));
    }
};

export const rotateAroundZAxis = (value: number, context: AppContext) => (
    { getState, dispatch }: StoreActionAPI<AppState>,
) => {
    const st = getState();
    const { paused } = st;
    const { processRotation } = context;

    dispatch(pause());

    const delta = value - st.rotation.gamma;

    dispatch(actions.setRotationGamma(value));

    processRotation(0, 0, delta);

    if (!paused) {
        dispatch(run(context));
    }
};

export const changeGScale = (gScale: number, context: AppContext) => (
    { getState, dispatch }: StoreActionAPI<AppState>,
) => {
    const st = getState();
    const { paused } = st;

    dispatch(pause());

    dispatch(actions.setGScale(gScale));

    if (!paused) {
        dispatch(run(context));
    }
};

export const changeKScale = (kScale: number, context: AppContext) => (
    { getState, dispatch }: StoreActionAPI<AppState>,
) => {
    const st = getState();
    const { paused } = st;

    dispatch(pause());

    dispatch(actions.setKScale(kScale));

    if (!paused) {
        dispatch(run(context));
    }
};

export const changeZoom = (value: number, context: AppContext) => (
    { getState, dispatch }: StoreActionAPI<AppState>,
) => {
    const st = getState();
    const { paused } = st;
    const { processRotation } = context;

    const zoom = minmax(MIN_ZOOM, MAX_ZOOM, value);
    if (zoom === st.zoom) {
        return;
    }

    dispatch(pause());

    dispatch(actions.setZoom(zoom));

    processRotation(0, 0, 0);

    if (!paused) {
        dispatch(run(context));
    }
};

export const changeDrawPath = (drawPath: boolean, context: AppContext) => (
    { getState, dispatch }: StoreActionAPI<AppState>,
) => {
    const st = getState();
    const { paused } = st;

    dispatch(pause());

    dispatch(actions.setDrawPath(drawPath));

    if (!paused) {
        dispatch(run(context));
    }
};

export const changeDrawPathLength = (pathLength: number, context: AppContext) => (
    { getState, dispatch }: StoreActionAPI<AppState>,
) => {
    const st = getState();
    const { paused } = st;

    dispatch(pause());

    dispatch(actions.setDrawPathLength(pathLength));

    if (!paused) {
        dispatch(run(context));
    }
};
