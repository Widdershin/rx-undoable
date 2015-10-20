/* globals describe, it */

import Rx from 'rx';
import assert from 'assert';
import Undo from '../src/undo';

Rx.config.longStackSupport = true;

function prettyMessage (message) {
  if (message.value.kind === 'N') {
    return `  @${message.time}: ${JSON.stringify(message.value.value)}`;
  }

  if (message.value.kind === 'C') {
    return `  @${message.time}: -- Complete --`;
  }

  if (message.value.kind === 'E') {
    console.trace(message.value.error);
    return `  @${message.time}: -- Error! --: ${message.value.error}`
  }

  return '  IMPLEMENT KIND ' + message.value.kind;
}

function prettyMessages (messages) {
  return messages.map(prettyMessage).join('\n');
}

function createMessage (expected, actual) {
  return 'Expected: \n[\n' + prettyMessages(expected) + '\n]\r\n\nActual: \n[\n' + prettyMessages(actual) + '\n]';
}

// Using QUnit testing for assertions
var collectionAssert = {
  assertEqual: function (expected, actual) {
    let comparer = Rx.internals.isEqual;
    let isOk = true;

    let isEqualSize = true;

    if (expected.length !== actual.length) {
      console.log('Not equal length. Expected: ' + expected.length + ' Actual: ' + actual.length);
      isEqualSize = false;
    }

    for(var i = 0, len = expected.length; i < len; i++) {
      isOk = comparer(expected[i], actual[i]);
      if (!isOk) {
        break;
      }
    }

    assert(isOk && isEqualSize, createMessage(expected, actual));
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
      onNext(250, {count: 0}),
      onNext(400, {count: 1})
    );

    const undo$ = scheduler.createHotObservable(
      onNext(500, true)
    );

    const results = scheduler.startScheduler(() => {
      return Undo(state$, undo$).state$;
    });

    collectionAssert.assertEqual([
      onNext(250, {count: 0}),
      onNext(400, {count: 1}),
      onNext(500, {count: 0})
    ], results.messages);

    done();
  });

  it("doesn't blow up if you undo too many times", (done) => {
    const scheduler = new Rx.TestScheduler();

    const state$ = scheduler.createHotObservable(
      onNext(250, {count: 0}),
      onNext(300, {count: 1}),
      onNext(650, {count: 1})
    );

    const undo$ = scheduler.createHotObservable(
      onNext(500, true),
      onNext(550, true),
      onNext(600, true)
    );

    const results = scheduler.startScheduler(() => {
      return Undo(state$, undo$).state$;
    });

    collectionAssert.assertEqual([
      onNext(250, {count: 0}),
      onNext(300, {count: 1}),
      onNext(500, {count: 0}),
      onNext(650, {count: 1})
    ], results.messages);

    done();
  });
});

