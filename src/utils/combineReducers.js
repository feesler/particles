/**
 * Returns combined function for specified list of reducers
 *
 * @param  {...any} reducers
 * @returns {Function}
 */
export const combineReducers = (...reducers) => (
  (state, action) => {
    for (let i = 0; i < reducers.length; i += 1) {
      const reducer = reducers[i];
      const res = reducer(state, action);
      if (res !== state) {
        return res;
      }
    }

    return state;
  }
);
