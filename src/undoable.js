import Rx from 'rx';
import _ from 'lodash';

function updateStreamEvents (events, event, index) {
  return events.concat([{event, index}]);
}

function recordStream (stream) {
  return stream
    .scan(updateStreamEvents, [])
    .share();
}

function sumAndLimitUndoPosition (total, {events, change}) {
  if (events.length === 0) { return 0; }

  const minimumPossibleUndoPosition = (-events.length) + 1;

  return _.min([0, _.max([minimumPossibleUndoPosition, total + change])]);
}

function eventIndexFromUndoPosition (previousState, {undoPosition, events}) {
  const theFutureHasChanged = () => events.length > previousState.events.length && undoPosition !== 0;

  console.log(events);
  console.log('\nundoPosition', undoPosition, '\n');
  if (theFutureHasChanged()) {
    console.log('future changed\n');
    return {undoPosition: 0, events: events.slice(events.length - 1 + undoPosition)}
  }

  return {undoPosition, events};
}

function undoAndRedoStream (recordedStream$, undo$, redo$) {
  console.log('------------------------');
  const undoPositionChange$ = Rx.Observable.merge(
    undo$.map(_ => -1),
    redo$.map(_ => +1)
  );

  const undoPosition$ = undoPositionChange$
    .withLatestFrom(recordedStream$, (change, events) => ({change, events}))
    .startWith({events: [], change: 0})
    .scan(sumAndLimitUndoPosition, 0);

  return Rx.Observable
    .combineLatest(undoPosition$, recordedStream$, (undoPosition, events) => ({undoPosition, events}))
    .scan(eventIndexFromUndoPosition, {undoPosition: 0, events: []})
    .map(({events, undoPosition}) => events[events.length - 1 + undoPosition])
    .distinctUntilChanged()
    .pluck('event')
    .do(value => console.log(`value: ${value}\n---\n`));
}

const emptyObservable = Rx.Observable.empty();

export default function Undo (state$, undo$, redo$ = emptyObservable) {
  return undoAndRedoStream(recordStream(state$), undo$, redo$);
}
