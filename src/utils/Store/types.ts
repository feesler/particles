import React, { ReactNode } from 'react';
import { Store } from './Store.js';

export type StoreActionPayload = object | string | number | boolean | bigint | symbol | null;

export interface StoreActionObject {
    type: string,
    payload?: StoreActionPayload,
}

export type StoreActionPayloadFunction = (payload?: StoreActionPayload) => StoreActionObject;
export type StoreActionFunction = (api: StoreActionAPI | null) => void;

export type StoreAction = StoreActionObject | StoreActionFunction;

export type StoreState = object;

export type StoreReducer<State extends StoreState = StoreState> = (
    state: State,
    action: StoreActionObject,
) => State;

export type StoreReducersList<State extends StoreState = StoreState> =
    StoreReducer<State> | StoreReducer<State>[];

export type StoreActionReducer<State extends StoreState = StoreState> = (
    state: State,
    payload?: StoreActionPayload,
) => State;

export interface StoreOptions<State extends StoreState = StoreState> {
    initialState?: State,
    sendInitialState?: true,
}

export type StoreListener<State extends StoreState = StoreState> = (
    state: State,
    prevState: State,
) => void;

export type StoreDispatchFunction = (action: StoreAction) => void;
export type StoreGetStateFunction<State extends StoreState = StoreState> = () => State;

export interface StoreActionAPI<State extends StoreState = StoreState> {
    dispatch: StoreDispatchFunction,
    getState: StoreGetStateFunction<State>,
}

export type StoreUpdaterFunction<State extends StoreState = StoreState> = (prev: State) => State;

export type StoreUpdater<State extends StoreState = StoreState> = React.SetStateAction<State>;

// StoreProvider

export interface StoreProviderProps<State extends StoreState = StoreState> {
    reducer: StoreReducer<State>,
    initialState: State,
    children: ReactNode,
}

export interface StoreProviderContext<State extends StoreState = StoreState> {
    store: Store | object,
    state: State,
    getState: () => State,
    setState: (state: StoreUpdater) => void,
    dispatch: (action: StoreAction) => void,
}
