/* globals describe, it */

import Rx from 'rx';
import assert from 'assert';
import Undo from '../src/undo';

describe('Undo', () => {
  it('takes a stream of state and a stream of undo intent', (done) => {
    const state$ = Rx.Observable.just(
      {count: 0}
    );

    const undo$ = Rx.Observable.empty();

    const undo = Undo(state$, undo$);

    done()
  });
})

