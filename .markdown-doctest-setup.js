const Rx = require('rx');

const fakeCycleDOM = {
  h: () => {},
  makeDOMDriver: () => () => ({
    select: () => ({events: () => Rx.Observable.just({})})
  })
};


module.exports = {
  require: {
    'rx': Rx,
    '@cycle/core': require('@cycle/core'),
    '@cycle/dom': fakeCycleDOM,
    'rx-undoable': require('.')
  },

  globals: {
    Rx
  }
}
