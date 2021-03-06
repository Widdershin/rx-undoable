[![npm version](https://badge.fury.io/js/rx-undoable.svg)](http://badge.fury.io/js/rx-undoable)
[![Build Status](https://travis-ci.org/Widdershin/rx-undoable.svg?branch=master)](https://travis-ci.org/Widdershin/rx-undoable)

* * * 

# rx-undoable

Easily undo and redo RxJS observables.

Great for adding undo and redo buttons to Cycle.js applications.

Installation
---

`npm install --save rx-undoable`

Usage
---

```js
import undoableScan from 'rx-undoable';

const numbers$ = Rx.Observable.range(1, 5);

const undo$ = Rx.Observable.just(1).delay(1000); // observable of undo intent, like clicking an undo button

const undoableSum$ = undoableScan(
  numbers$,
  (total, change) => total + change,
  0,
  undo$
).pluck('present');
```


API
---

###`undoableScan(stream$, f, initialValue, undo$, [redo$, {historySize: Infinite}])`

Which is equivalent to `stream$.scan(f, initialValue)`, except that data is returned in this format:

<!-- skip-example -->
```js
{
  past: [...],
  present: thing,
  future: [...]
}
```

So to get the present data, use `undoableScan(...).pluck('present')`.

Arguments:

`stream$`: An RxJS stream  
`f`: A function as you would use with `scan` or `reduce`. `(previousValue, currentValue) => nextValue`  
`initialValue`: The initial value to be used as `present`.  
`undo$`: An RxJS stream that will cause an undo each time it emits  
`redo$`: An optional RxJS stream that will cause a redo each time it emits  

`options`: An optional object carrying additional options  
`historySize`: A size limit for the `past` array. Defaults to Infinity


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

`rx-undoable` was inspired by [omnidan/redux-undo](https://github.com/omnidan/redux-undo) and the algorithm used is described very eloquently by [Dan Abramov in the Redux documentation](http://redux.js.org/docs/recipes/ImplementingUndoHistory.html).

Contributing
---

Issues, pull requests and feedback of all sorts welcome! If you're unsure, send me an email at [ncwjohnstone@gmail.com](mailto:ncwjohnstone@gmail.com).
