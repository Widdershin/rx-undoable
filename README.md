# rx-undoable

Easily undo and redo RxJS observables.

Great for adding undo and redo buttons to Cycle.js applications.

Installation
---

`npm install --save rx-undoable`

Usage
---

```
import undoableScan = 'rx-undoable';

const numbers$ = Rx.Observable.range(1, 5);

const undo$ = ... // observable of undo intent, like clicking an undo button

const undoableSum$ = undoableScan(
  numbers$,
  (total, change) => total + change,
  0,
  undo$
).pluck('present');
```


API
---

###`undoableScan(stream$, accumulator, seed, undo$, [redo$])`

Which is equivalent to `stream$.scan(accumulator, seed)`, except that data is returned in this format:

```
{
  past: [...],
  present: thing,
  future: [...]
}
```

So to get the present data, use `undoableScan(...).pluck('present')`.


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
    DOM: count$.map(count =>
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
import undoableScan from 'rx-undoable';

function main ({DOM}) {
  let action$ = Rx.Observable.merge(
    DOM.select('.subtract').events('click').map(ev => -1),
    DOM.select('.add').events('click').map(ev => +1)
  );

  let undo$ = DOM.select('.undo').events('click');           // NEW
  let redo$ = DOM.select('.redo').events('click');           // NEW

  let count$ = undoableScan(                                 // NEW
    action$,                                                 // NEW
    (x, y) => x + y,                                         // NEW
    0,                                                       // NEW
    undo$,                                                   // NEW
    redo$                                                    // NEW
  ).pluck('present');                                        // NEW

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

`rx-undoable` was inspired by [omnidan/redux-undo](https://github.com/omnidan/redux-undo) and the algorithm used is described very eloquently by [Dan Abramov in the Redux documentation](http://rackt.org/redux/docs/recipes/ImplementingUndoHistory.html).

Contributing
---

Issues, pull requests and feedback of all sorts welcome! If you're unsure, send me an email at [ncwjohnstone@gmail.com](mailto:ncwjohnstone@gmail.com).
