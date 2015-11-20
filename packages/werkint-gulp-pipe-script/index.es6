'use strict';

import _ from 'lodash';
import Q from 'q';
import gulpUtil from 'gulp-util';
import babel from 'gulp-babel';
import gulpif from 'gulp-if'
import path from 'path';

export default function () {
  return Q.promise(resolve => {
    resolve(config => {
      return gulpUtil.noop()
        .pipe(gulpif(file => path.extname(file.path) === '.es6', // TODO: to options
          babel({
            presets: ['es2015'],
            plugins: ['add-module-exports', 'transform-es2015-modules-amd'],
          })
        ));
    })
  });
}
