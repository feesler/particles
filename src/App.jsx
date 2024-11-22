import { getInitialState, MainView } from './components/MainView/MainView.jsx';
import { StoreProvider } from './utils/Store/StoreProvider.jsx';
import { createSlice } from './utils/createSlice.js';
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
