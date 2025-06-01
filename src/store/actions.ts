import { minmax, StoreActionAPI, StoreActionFunction } from '@jezvejs/react';
import { MAX_ZOOM, MIN_ZOOM } from 'src/constants.ts';
import { AppState } from 'src/types.ts';
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

export const run = (scheduleUpdate: () => void) => ({
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

export const rotateAroundXAxis = (value: number, viewAPI: MainViewActionsAPI) => (
    { getState, dispatch }: StoreActionAPI<AppState>,
) => {
    const st = getState();
    const { paused } = st;
    const { scheduleUpdate, processRotation } = viewAPI;

    dispatch(pause());

    const val = value;
    const delta = val - st.rotation.alpha;

    dispatch(actions.setRotationAlpha(value));

    processRotation(delta, 0, 0);

    if (!paused) {
        dispatch(run(scheduleUpdate));
    }
};

export const rotateAroundYAxis = (value: number, viewAPI: MainViewActionsAPI) => (
    { getState, dispatch }: StoreActionAPI<AppState>,
) => {
    const st = getState();
    const { paused } = st;
    const { scheduleUpdate, processRotation } = viewAPI;

    dispatch(pause());

    const delta = value - st.rotation.beta;

    dispatch(actions.setRotationBeta(value));

    processRotation(0, delta, 0);

    if (!paused) {
        dispatch(run(scheduleUpdate));
    }
};

export const rotateAroundZAxis = (value: number, viewAPI: MainViewActionsAPI) => (
    { getState, dispatch }: StoreActionAPI<AppState>,
) => {
    const st = getState();
    const { paused } = st;
    const { scheduleUpdate, processRotation } = viewAPI;

    dispatch(pause());

    const delta = value - st.rotation.gamma;

    dispatch(actions.setRotationGamma(value));

    processRotation(0, 0, delta);

    if (!paused) {
        dispatch(run(scheduleUpdate));
    }
};

export const changeGScale = (gScale: number, viewAPI: MainViewActionsAPI) => (
    { getState, dispatch }: StoreActionAPI<AppState>,
) => {
    const st = getState();
    const { paused } = st;
    const { scheduleUpdate } = viewAPI;

    dispatch(pause());

    dispatch(actions.setGScale(gScale));

    if (!paused) {
        dispatch(run(scheduleUpdate));
    }
};

export const changeKScale = (kScale: number, viewAPI: MainViewActionsAPI) => (
    { getState, dispatch }: StoreActionAPI<AppState>,
) => {
    const st = getState();
    const { paused } = st;
    const { scheduleUpdate } = viewAPI;

    dispatch(pause());

    dispatch(actions.setKScale(kScale));

    if (!paused) {
        dispatch(run(scheduleUpdate));
    }
};

export const changeZoom = (value: number, viewAPI: MainViewActionsAPI) => (
    { getState, dispatch }: StoreActionAPI<AppState>,
) => {
    const st = getState();
    const { paused } = st;
    const { scheduleUpdate, processRotation } = viewAPI;

    const zoom = minmax(MIN_ZOOM, MAX_ZOOM, value);
    if (zoom === st.zoom) {
        return;
    }

    dispatch(pause());

    dispatch(actions.setZoom(zoom));

    processRotation(0, 0, 0);

    if (!paused) {
        dispatch(run(scheduleUpdate));
    }
};

export const changeDrawPath = (drawPath: boolean, viewAPI: MainViewActionsAPI) => (
    { getState, dispatch }: StoreActionAPI<AppState>,
) => {
    const st = getState();
    const { paused } = st;
    const { scheduleUpdate } = viewAPI;

    dispatch(pause());

    dispatch(actions.setDrawPath(drawPath));

    if (!paused) {
        dispatch(run(scheduleUpdate));
    }
};

export const changeDrawPathLength = (pathLength: number, viewAPI: MainViewActionsAPI) => (
    { getState, dispatch }: StoreActionAPI<AppState>,
) => {
    const st = getState();
    const { paused } = st;
    const { scheduleUpdate } = viewAPI;

    dispatch(pause());

    dispatch(actions.setDrawPathLength(pathLength));

    if (!paused) {
        dispatch(run(scheduleUpdate));
    }
};
