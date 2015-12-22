Gulp
=====

TODO: write description

package.json
````
{
    ...
    "dependencies": {
        "babel-plugin-add-module-exports":           "^0.1.1",
        "babel-plugin-transform-decorators-legacy":  "^1.3.1",
        "babel-plugin-transform-es2015-modules-amd": "^6.3.13",
        "babel-preset-es2015":                       "^6.3.13",
        "babel-preset-stage-0":                      "^6.3.13",

        "gulp":                                      "^3.9.0",
        "werkint-gulp":                              "^0.0.13"
    }
}
````

gulpfile.js
````
'use strict';
require('werkint-gulp')({
  gulp:      require('gulp'),
  root:      __dirname,
  configDir: __dirname + '/app/config/gulp',
});

````

config.json
````
'use strict';

module.exports = {
  twigGlobals: undefined, // twigGlobals.js
  autodump:    false,

  types: {
    stylesheet: ['css', 'less', 'sass', 'scss'],
    script:     ['js', 'es6', 'json'],
    image:      ['jpg', 'jpeg', 'gif', 'svg', 'png'],
    template:   ['twig'],
    raw:        ['*'],
  },

  paths: {
    data:  "./data",
    views: "./src",
    web:   "./web/assets",
  },

  pipes: {
    stylesheet: {
      includePaths: [],
    },
    script:     {
      babelPresets:  ['es2015', 'stage-0'],
      babelPlugins: [
        'transform-decorators-legacy',
        'add-module-exports',
        'transform-es2015-modules-amd',
      ],
    }
  },

  assetPrefix: "/static",

  server: {
    host: 'localhost',
    port: 8080,
  },

  browserSync: {
    host: 'localhost',
    port: 8081,
  },

  bower: {
    root:          null,
    packages:      {},
    target:        './bower_components',
    mainFile:      './app/config/gulp/bower.json',
    targetFile:    './bower.json',
    overridesName: 'overrides.json',
    overrides:     {},
  },

  sprites: [],
};
````
