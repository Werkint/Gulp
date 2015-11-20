'use strict';

import _ from 'lodash';
import Q from 'q';

import taskDump from 'werkint-gulp-task-dump';
import taskWatch from 'werkint-gulp-task-watch';
import taskServer from 'werkint-gulp-task-server';
import taskBower from 'werkint-gulp-task-bower';

export default app => {
  let ret = {
    dump:   taskDump,
    watch:  taskWatch,
    server: taskServer,
    bower:  taskBower,
  };
  return Q.all(_.map(ret, (clb, name) =>
    clb(app).then(result => ret[name] = result))).then(() => ret);
};
