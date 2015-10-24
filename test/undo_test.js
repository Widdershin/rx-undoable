/* globals describe, it */

import Rx from 'rx';
import assert from 'assert';
import '../src/undoable';

import _ from 'lodash';

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
    return `  @${message.time}: -- Error! --: ${message.value.error}`;
  }

  return '  IMPLEMENT KIND ' + message.value.kind;
}

function prettyMessages (messages) {
  return messages.map(prettyMessage).join('\n');
}

function createMessage (expected, actual) {
  return 'Expected: \n[\n' + prettyMessages(expected) + '\n]\r\n\nActual: \n[\n' + prettyMessages(actual) + '\n]';
}

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

describe('undoableScan', () => {
  it("doesn't blow up if you undo too many times", (done) => {
    const scheduler = new Rx.TestScheduler();

    const add$ = scheduler.createHotObservable(
      onNext(250, 1),
      onNext(300, 1),
      onNext(650, 1)
    );

    const undo$ = scheduler.createHotObservable(
      onNext(500, true),
      onNext(550, true),
      onNext(600, true)
    );

    const results = scheduler.startScheduler(() => {
      return add$.undoableScan(_.add, 0, undo$);
    });

    collectionAssert.assertEqual([
      onNext(200, {past: [], present: 0, future: []}), // Start
      onNext(250, {past: [0], present: 1, future: []}), // Add
      onNext(300, {past: [0, 1], present: 2, future: []}), // Add
      onNext(500, {past: [0], present: 1, future: [2]}), // Undo
      onNext(550, {past: [], present: 0, future: [1, 2]}),  // Undo
      onNext(600, {past: [], present: 0, future: [1, 2]}),  // Undo
      onNext(650, {past: [0], present: 1, future: []})  // Add
    ], results.messages);
    done();
  });

  it('optionally redoes', (done) => {
    const scheduler = new Rx.TestScheduler();

    const add$ = scheduler.createHotObservable(
      onNext(250, 1),
      onNext(300, 1),
      onNext(350, 1)
    );

    const undo$ = scheduler.createHotObservable(
      onNext(500, true)
    );

    const redo$ = scheduler.createHotObservable(
      onNext(600, true),
      onNext(620, true)
    );

    const results = scheduler.startScheduler(() => {
      return add$.undoableScan(_.add, 0, undo$, redo$);
    });

    collectionAssert.assertEqual([
      onNext(200, {past: [], present: 0, future: []}), // Start
      onNext(250, {past: [0], present: 1, future: []}), // Add
      onNext(300, {past: [0, 1], present: 2, future: []}), // Add
      onNext(350, {past: [0, 1, 2], present: 3, future: []}), // Add
      onNext(500, {past: [0, 1], present: 2, future: [3]}), // Undo
      onNext(600, {past: [0, 1, 2], present: 3, future: []}),  // Redo
      onNext(620, {past: [0, 1, 2], present: 3, future: []})  // Redo
    ], results.messages);

    done();
  });

  it('throws away redo state if a user undos and does something different', (done) => {
    const scheduler = new Rx.TestScheduler();

    const add$ = scheduler.createHotObservable(
      onNext(250, 1),
      onNext(300, 1),
      onNext(320, 1)
    );

    const subtract$ = scheduler.createHotObservable(
      onNext(500, -1)
    );

    const undo$ = scheduler.createHotObservable(
      onNext(400, true)
    );

    const results = scheduler.startScheduler(() => {
      return add$.merge(subtract$).undoableScan(_.add, 0, undo$);
    });

    collectionAssert.assertEqual([
      onNext(200, {past: [], present: 0, future: []}), // Start
      onNext(250, {past: [0], present: 1, future: []}), // Add
      onNext(300, {past: [0, 1], present: 2, future: []}), // Add
      onNext(320, {past: [0, 1, 2], present: 3, future: []}), // Add
      onNext(400, {past: [0, 1], present: 2, future: [3]}), // Undo
      onNext(500, {past: [0, 1, 2], present: 1, future: []})  // Subtract
    ], results.messages);

    done();
  });
});

