'use strict';

import _ from 'lodash'
import Q from 'q'
import gulp from 'gulp'
import multipipe from 'multipipe'
import gulpif from 'gulp-if'

export default class Transform {
  constructor(config, pipes) {
    this.config = config;
    this.pipes = pipes;
  }

  transform() {
    return multipipe(..._.map(this.pipes, (pipe, name) => {
      return gulpif(file => file.context.type === name,
        pipe(this.pipeConfig(name))
      );
    }));
  }

  pipeConfig(pipe) {
    return this.config.pipes[pipe];
  }
}
