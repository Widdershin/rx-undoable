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

function sourceEvent (f, eventValue) {
  return ({past, present, future}) => {
    return {
      past: past.concat([present]),
      present: f(present, eventValue),
      future: []
    };
  };
}

Rx.Observable.prototype.undoableScan = function (f, defaultValue, undo$, redo$ = emptyObservable) {
  if (undo$ === undefined) {
    throw new Error('Must pass a stream of undo$ intent');
  }

  const source$ = this;

  const action$ = Rx.Observable.merge(
    source$.map(event => sourceEvent(f, event)),
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
