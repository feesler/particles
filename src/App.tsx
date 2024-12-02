import { createSlice, StoreProvider } from '@jezvejs/react';
import { MainView } from './components/MainView/MainView.tsx';
import { getInitialState } from './components/MainView/initialState.ts';
import './App.css';

const slice = createSlice({});
const { reducer } = slice;

export function App() {
    const initialState = getInitialState();

    return (
        <StoreProvider
            reducer={reducer}
            initialState={initialState}
        >
            <MainView />
        </StoreProvider>
    );
}
