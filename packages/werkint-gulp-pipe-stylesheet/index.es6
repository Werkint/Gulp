'use strict';
import _ from 'lodash';
import Q from 'q';
import sass from 'gulp-sass';
import gulpif from 'gulp-if';
import autoprefixer from 'gulp-autoprefixer';
import gutil from 'gulp-util';
import path from 'path';

export default () => {
  return Q.promise(resolve => {
    resolve(config => {
      let pipe = gutil.noop();

      let sassPipe = sass({
        includePaths: _.pluck(config.includePaths, 'path'),
      });
      if (config.autoprefixer) {
        sassPipe.pipe(autoprefixer(config.autoprefixer))
      }
      pipe = pipe.pipe(gulpif(file => path.extname(file.path) === '.scss', sassPipe));

      return pipe;
    });
  });
}
