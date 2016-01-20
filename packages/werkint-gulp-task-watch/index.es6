'use strict';

import _ from 'lodash';
import Q from 'q';
import gulp from 'gulp';
import EventEmitter from 'events';
import BrowerSync from 'browser-sync';

export default app => Q.promise(resolve => {
  resolve(() => Q.promise((resolve, reject) => {
    // TODO: to events
    const emitter = new EventEmitter();
    emitter.on('change', (event, glob) => {
      let pipe;
      if (glob.type === 'stylesheet') {
        pipe = app.dumper.getPipe([glob], true);
        console.log('Refreshing all stylesheets in current glob');
      } else {
        pipe = app.dumper.getPipeFromFile(event.path, glob);
      }
      pipe
        .pipe(app.transform())
        .pipe(app.save())
        .on('error', reject)
        .on('finish', event => {
          emitter.emit('dump');
        });
    });
    emitter.on('dump', event => {
      app.emitter.emit('reload');
    });

    _.each(app.globs, glob => {
      gulp.watch(glob.path)
        .on('change', event => {
          console.log('File changed:', event.path);
          emitter.emit('change', event, glob);
        })
        .on('error', reject);
    });

    if (app.config.browserSync) {
      let browserSync = BrowerSync.create()
        , config      = app.config.browserSync;
      browserSync.init({
        ui:             false,
        port:           config.port,
        host:           config.host,
        logSnippet:     false,
        logFileChanges: false,
      });
      console.log(
        'BrowserSync started on address',
        config.listenPath
      );

      app.emitter.on('reload', browserSync.reload);
    }
  }));
});
