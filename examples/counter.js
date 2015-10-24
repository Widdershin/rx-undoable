import Rx from 'rx';
import {run} from '@cycle/core';
import {h, makeDOMDriver} from '@cycle/dom';
import '../src/undoable';                                        // NEW

function main ({DOM}) {
  let action$ = Rx.Observable.merge(
    DOM.select('.subtract').events('click').map(ev => -1),
    DOM.select('.add').events('click').map(ev => +1)
  );

  let undo$ = DOM.select('.undo').events('click');           // NEW
  let redo$ = DOM.select('.redo').events('click');           // NEW

  let count$ = action$
    .startWith(0)
    .undoableScan((x, y) => x + y, 0, undo$, redo$);         // CHANGED

  return {
    DOM: count$.map(count =>
      h('div', [
        h('button.undo', 'Undo'),                            // NEW
        h('button.redo', 'Redo'),                            // NEW

        h('button.subtract', 'Subtract'),
        h('button.add', 'Add'),

        h('p', 'Counter: ' + count.present)
      ])
    )
  };
}

run(main, {
  DOM: makeDOMDriver('.app')
});
