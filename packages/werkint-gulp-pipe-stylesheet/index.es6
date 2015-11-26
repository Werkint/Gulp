'use strict';

import _ from 'lodash'
import Q from 'q'
import sass from 'gulp-sass'

export default () => {
  return Q.promise(resolve => {
    resolve(config => {
      return sass({
        includePaths: _.pluck(config.includePaths, 'path'),
      });
    });
  });
}
