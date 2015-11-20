'use strict';

module.exports = function (context, callback) {
  /**
   * For es6 support
   * @see https://babeljs.io/docs/usage/require/
   */
  require('babel-core/register')({
    ignore:     false,
    extensions: ['.es6'],
    presets:    ['es2015'],
  });

  var driver = require('markup-driver-symfony').default
    , App = require('./app').default;

  new App(driver, context, callback);
};

