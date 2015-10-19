/* globals describe, it */

import Rx from 'rx';
import assert from 'assert';
import Undo from '../src/undo';

function createMessage(actual, expected) {
  return 'Expected: [' + expected.toString() + ']\r\nActual: [' + actual.toString() + ']';
}

// Using QUnit testing for assertions
var collectionAssert = {
  assertEqual: function (expected, actual) {
    var comparer = Rx.internals.isEqual,
      isOk = true;

    if (expected.length !== actual.length) {
      assert(false, 'Not equal length. Expected: ' + expected.length + ' Actual: ' + actual.length);
      return;
    }

    for(var i = 0, len = expected.length; i < len; i++) {
      isOk = comparer(expected[i], actual[i]);
      if (!isOk) {
        break;
      }
    }

    assert(isOk, createMessage(expected, actual));
  }

};

const onNext = Rx.ReactiveTest.onNext,
    onCompleted = Rx.ReactiveTest.onCompleted,
    subscribe = Rx.ReactiveTest.subscribe;

describe('Undo', () => {
  it('takes a stream of state and a stream of undo intent', (done) => {
    const state$ = Rx.Observable.just(
      {count: 0}
    );

    const undo$ = Rx.Observable.empty();

    Undo(state$, undo$);

    done();
  });

  it('undoes changes to state when asked', (done) => {
    const scheduler = new Rx.TestScheduler();

    const state$ = scheduler.createHotObservable(
      onNext(100, {count: 0}),
      onNext(200, {count: 1}),
      onCompleted(500)
    );

    const undo$ = scheduler.createHotObservable(
      onNext(300, true),
      onCompleted(500)
    );

    const undo = Undo(state$, undo$);

    collectionAssert.assertEqual(undo.state$.messages, [
      onNext(100, {count: 0}),
      onNext(200, {count: 1}),
      onNext(300, {count: 0}),
      onCompleted(500)
    ]);

    state$.onNext({count: 0});
    state$.onNext({count: 1});
    undo$.onNext(true);

    done();
  });
});

