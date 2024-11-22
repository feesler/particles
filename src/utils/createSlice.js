import { isObject } from '@jezvejs/types';

/**
 * Returns map of actions and reducer function for specified reducers object
 *
 * @param {object} reducers
 * @returns {object}
 */
export function createSlice(
  reducers,
) {
  if (!isObject(reducers)) {
    throw new Error('Invalid actions object');
  }

  const slice = {
    actions: {},
    reducers: {},
    reducer(state, action) {
      if (!(action.type in slice.reducers)) {
        return state;
      }

      const reduceFunc = slice.reducers[action.type];
      return reduceFunc(state, action.payload);
    },
  };

  Object.entries(reducers).forEach(([action, reducer]) => {
    slice.actions[action] = (payload) => ({ type: action, payload });
    slice.reducers[action] = reducer;
  });

  return slice;
}
