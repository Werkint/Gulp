'use strict';

import _ from 'lodash';
import Q from 'q';
import gulpUtil from 'gulp-util';
import babel from 'gulp-babel';
import gulpif from 'gulp-if'
import path from 'path';

export default () => {
  return Q.promise(resolve => {
    resolve(config => {
      let plugins = config.babelPlugins || [
          'add-module-exports',
          'transform-es2015-modules-amd',
        ];
      return gulpUtil.noop()
        .pipe(gulpif(file => path.extname(file.path) === '.es6', // TODO: to options
          babel({
            stage: 0,
            modules: 'amd', // TODO: remove
            //presets: ['es2015'], TODO: babel 6
            //plugins: plugins,
          })
        ));
    })
  });
}
