import { StoreProvider } from '@jezvejs/react';

import { MainView } from './components/MainView/MainView.tsx';
import { getInitialState } from './components/MainView/initialState.ts';

import { reducer } from './store/reducer.ts';

import { AppState } from './types.ts';

import './App.css';

export function App() {
    const initialState = getInitialState();

    return (
        <StoreProvider<AppState>
            reducer={reducer}
            initialState={initialState}
        >
            <MainView />
        </StoreProvider>
    );
}
