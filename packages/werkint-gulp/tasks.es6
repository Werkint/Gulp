'use strict';

import _ from 'lodash';
import Q from 'q';

import taskDump from 'markup-task-dump';
import taskWatch from 'markup-task-watch';
import taskServer from 'markup-task-server';
import taskBower from 'markup-task-bower';

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
