'use strict';
import _ from 'lodash';
import Q from 'q';
import sass from 'gulp-sass';
import autoprefixer from 'gulp-autoprefixer';

export default () => {
  return Q.promise(resolve => {
    resolve(config => {
      let pipe = sass({
        includePaths: _.pluck(config.includePaths, 'path'),
      });

      if (config.autoprefixer) {
        pipe.pipe(autoprefixer(config.autoprefixer))
      }

      return pipe;
    });
  });
}
