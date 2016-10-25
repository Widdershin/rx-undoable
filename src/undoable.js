import Rx from 'rx';
import _ from 'lodash';

const emptyObservable = Rx.Observable.empty();

function undo () {
  return ({past, present, future}) => {
    if (past.length === 0) {
      return {past, present, future};
    }

    return {
      past: past.slice(0, past.length - 1),
      present: _.last(past),
      future: [present].concat(future)
    };
  };
}

function redo () {
  return ({past, present, future}) => {
    if (future.length === 0) {
      return {past, present, future};
    }

    return {
      past: past.concat([present]),
      present: _.first(future),
      future: future.slice(1)
    };
  };
}

function sourceEvent (f, eventValue, historySize) {
  return ({past, present, future}) => {
    return {
      past: past.concat([present]).slice(-historySize),
      present: f(present, eventValue),
      future: []
    };
  };
}

module.exports = function undoableScan (source$, f, defaultValue, undo$, redo$ = emptyObservable, options = {}) {
  if (undo$ === undefined) {
    throw new Error('Must pass a stream of undo$ intent');
  }

  const historySize = options.historySize || Infinity;

  const action$ = Rx.Observable.merge(
    source$.map(event => sourceEvent(f, event, historySize)),
    undo$.map(undo),
    redo$.map(redo)
  );

  const initialState = {
    past: [],
    present: defaultValue,
    future: []
  };

  return action$
    .startWith(initialState)
    .scan((state, action) => action(state));
};
