import Rx from 'rx';
import {run} from '@cycle/core';
import {h, makeDOMDriver} from '@cycle/dom';
import undoable from '../src/undoable';                          // NEW

function main ({DOM}) {
  let action$ = Rx.Observable.merge(
    DOM.select('.subtract').events('click').map(ev => -1),
    DOM.select('.add').events('click').map(ev => +1)
  );

  let undo$ = DOM.select('.undo').events('click');           // NEW
  let redo$ = DOM.select('.redo').events('click');           // NEW

  let count$ = action$.startWith(0).scan((x, y) => x + y);

  let undoableCount$ = undoable(count$, undo$, redo$);       // NEW

  return {
    DOM: undoableCount$.map(count =>                         // CHANGED
      h('div', [
        h('button.undo', 'Undo'),                            // NEW
        h('button.redo', 'Redo'),                            // NEW

        h('button.subtract', 'Subtract'),
        h('button.add', 'Add'),

        h('p', 'Counter: ' + count)
      ])
    )
  };
}

run(main, {
  DOM: makeDOMDriver('.app')
});
