import {
    createContext,
    useContext,
    useMemo,
    useState,
} from 'react';
import { createStore } from './Store.js';

const initialContext = {
    store: {},
    state: {},
    getState: () => ({}),
    /* eslint-disable no-unused-vars */
    setState: (_) => { },
    dispatch: (_) => { },
    /* eslint-enable no-unused-vars */
};

const StoreContext = createContext(initialContext);

export function useStore() {
    return useContext(StoreContext);
}

export function StoreProvider(
    props,
) {
    const {
        reducer,
        children,
        ...options
    } = props;

    const [state, setState] = useState(options.initialState ?? {});

    const listener = (newState) => setState(newState);

    const store = useMemo(() => {
        const res = createStore(reducer, options);
        res.subscribe(listener);
        return res;
    }, []);

    const contextValue = useMemo(() => ({
        store,
        state,
        getState: () => store.getState(),
        setState: (update) => store.setState(update),
        dispatch: (action) => store.dispatch(action),
    }), [state]);

    return (
        <StoreContext.Provider value={contextValue}>
            {children}
        </StoreContext.Provider>
    );
}
