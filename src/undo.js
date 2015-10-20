import Rx from 'rx';

function recordStream (stream) {
  return stream
    .scan((events, event, index) => events.concat([{event, index}]), [])
    .share();
}

function undoStream (recordedStream$, undo$) {
  const position$ = undo$.map(_ => -1)
    .startWith(0)
    .scan((total, change) => total + change);

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
