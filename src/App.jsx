import { createSlice, StoreProvider } from '@jezvejs/react';
import { getInitialState, MainView } from './components/MainView/MainView.jsx';
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
