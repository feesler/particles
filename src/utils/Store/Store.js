/** State store class */
export class Store {
  reducer = null;

  state = {};

  listeners = [];

  sendInitialState = true;

  storeAPI = null;

  constructor(reducer, options = {}) {
    if (typeof reducer !== 'function') {
      throw new Error('Expected reducer to be a function');
    }

    const {
      initialState = {},
      sendInitialState = true,
    } = options;

    this.reducer = reducer;
    this.state = { ...initialState };
    this.listeners = [];
    this.sendInitialState = sendInitialState;

    this.storeAPI = {
      dispatch: (action) => this.dispatch(action),
      getState: () => this.getState(),
    };
  }

  getState() {
    return this.state;
  }

  dispatch(action) {
    if (typeof action === 'function') {
      action(this.storeAPI);
      return;
    }

    if (!this.reducer) {
      return;
    }

    const newState = this.reducer(this.getState(), action);
    const prevState = this.getState();
    this.state = newState;
    this.listeners.forEach((listener) => listener(newState, prevState));
  }

  setState(state) {
    const newState = (typeof state === 'function')
      ? state(this.getState())
      : state;
    if (this.state === newState) {
      return;
    }

    const prevState = this.getState();
    this.state = newState;
    this.listeners.forEach((listener) => listener(newState, prevState));
  }

  subscribe(listener) {
    if (typeof listener !== 'function') {
      throw new Error('Expected listener to be a function');
    }

    // Don't subscribe same listener twice
    if (this.listeners.some((l) => l === listener)) {
      return;
    }

    this.listeners.push(listener);

    // Send initial state to new listener
    if (this.sendInitialState) {
      listener(this.getState(), {});
    }
  }
}

export function createStore(
  reducer,
  options = {},
) {
  return new Store(reducer, options);
}
