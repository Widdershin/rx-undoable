# rx-undoable

**This project is still in a state of flux and is not ready for any real world use.**

Easily undo and redo RxJS observables.

Great for adding undo and redo buttons to Cycle.js applications.

Installation
---

`npm install --save rx-undoable`


Example
---

Let's take a simple counter example from the Cycle.js docs and add undo and redo buttons.

Before:
```js
import Rx from 'rx';
import {run} from '@cycle/core';
import {h, makeDOMDriver} from '@cycle/dom';

function main ({DOM}) {
  let action$ = Rx.Observable.merge(
    DOM.select('.subtract').events('click').map(ev => -1),
    DOM.select('.add').events('click').map(ev => +1)
  );

  let count$ = action$
    .startWith(0)
    .scan((x, y) => x + y);

  return {
    DOM: undoableCount$.map(count =>
      h('div', [
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
```

After:

```js
import Rx from 'rx';
import {run} from '@cycle/core';
import {h, makeDOMDriver} from '@cycle/dom';
import 'rx-undoable';                                        // NEW

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

        h('p', 'Counter: ' + count)
      ])
    )
  };
}

run(main, {
  DOM: makeDOMDriver('.app')
});
```

Prior art
---

`rx-undoable` was inspired by [omnidan/redux-undo](https://github.com/omnidan/redux-undo).

Contributing
---

Issues, pull requests and feedback of all sorts welcome! If you're unsure, send me an email at [ncwjohnstone@gmail.com](mailto:ncwjohnstone@gmail.com).
