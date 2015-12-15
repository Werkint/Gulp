'use strict';

import _ from 'lodash';
import Q from 'q';

import pipeStylesheet from 'werkint-gulp-pipe-stylesheet';
import pipeScript from 'werkint-gulp-pipe-script';
import pipeTwig from 'werkint-gulp-pipe-twig';

export default function () {
  let pipes = {
    stylesheet: pipeStylesheet,
    script:     pipeScript,
    template:   pipeTwig,
  };

  return Q.all(_.map(pipes,
    (pipeLoader, name) => pipeLoader()
      .then(pipe => {
        pipes[name] = pipe;
      })
  )).then(() => pipes);
};
