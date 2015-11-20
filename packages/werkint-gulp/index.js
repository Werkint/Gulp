'use strict';

module.exports = function (context) {
  /**
   * For es6 support
   * @see https://babeljs.io/docs/usage/require/
   */
  require('babel-core/register')({
    ignore:     false,
    extensions: ['.es6'],
    presets:    ['es2015'],
  });

  var driver = require('werkint-gulp-driver-symfony').default
    , App = require('./app').default;

  require('deasync')(function(callback){
    new App(driver, context, callback);
  })();
};

