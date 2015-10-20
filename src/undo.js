import Rx from 'rx';
import _ from 'lodash';

function recordStream (stream) {
  return stream
    .scan((events, event, index) => events.concat([{event, index}]), [])
    .share();
}

function undoStream (recordedStream$, undo$) {
  const position$ = undo$.map(_ => -1)
    .withLatestFrom(recordedStream$, (change, events) => ({change, events}))
    .startWith({events: [], change: 0})
    .scan((total, {events, change}) => {
      if (events.length === 0) { return 0; }

      const minimumPossibleUndoPosition = (-events.length) + 1;

      return _.max([minimumPossibleUndoPosition, total + change]);
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

export default function Undo (state$, undo$) {
  return {
    state$: undoStream(recordStream(state$), undo$)
  };
}
