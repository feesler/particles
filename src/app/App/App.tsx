import { StoreProvider } from '@jezvejs/react';

import { reducer } from 'store/reducer.ts';
import { AppState } from 'shared/types.ts';

import { AppContextProvider } from 'context/AppContextProvider.tsx';
import { MainView } from 'components/MainView/MainView.tsx';

import { getInitialState } from './initialState.ts';

import './App.css';

export function App() {
    const initialState = getInitialState();

    return (
        <StoreProvider<AppState>
            reducer={reducer}
            initialState={initialState}
        >
            <AppContextProvider>
                <MainView />
            </AppContextProvider>
        </StoreProvider>
    );
}
