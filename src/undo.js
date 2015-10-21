import Rx from 'rx';
import _ from 'lodash';

function recordStream (stream) {
  return stream
    .scan((events, event, index) => events.concat([{event, index}]), [])
    .share();
}

function undoAndRedoStream (recordedStream$, undo$, redo$) {
  const undoPositionChange$ = Rx.Observable.merge(
    undo$.map(_ => -1),
    redo$.map(_ => +1)
  );

  const position$ = undoPositionChange$
    .withLatestFrom(recordedStream$, (change, events) => ({change, events}))
    .startWith({events: [], change: 0})
    .scan((total, {events, change}) => {
      if (events.length === 0) { return 0; }

      const minimumPossibleUndoPosition = (-events.length) + 1;

      return _.min([0, _.max([minimumPossibleUndoPosition, total + change])]);
    }, 0);

  return Rx.Observable.combineLatest(
      position$,
      recordedStream$,
      (undoPosition, events) => {
        return events[events.length - 1 + undoPosition];
      }
    )
    .distinctUntilChanged()
    .map(event => event.event);
}

const emptyObservable = Rx.Observable.empty();

export default function Undo (state$, undo$, redo$ = emptyObservable) {
  return {
    state$: undoAndRedoStream(recordStream(state$), undo$, redo$)
  };
}
