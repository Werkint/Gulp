'use strict';
import _ from 'lodash';
import Q from 'q';
import gulp from 'gulp';
import merge from 'merge-stream';
import through from 'through2';
import gulpUtil from 'gulp-util';
import rename from './rename';

let types = [ // TODO: remove
  {
    name: 'stylesheet',
    ext:  ['css', 'less', 'sass', 'scss'],
  }, {
    name: 'script',
    ext:  ['js', 'es6'],
  }, {
    name: 'image',
    ext:  ['jpg', 'jpeg', 'gif', 'svg', 'png'],
  }, {
    name:   'template',
    prefix: 'views',
    ext:    ['twig'],
  }, {
    name:   'raw',
    prefix: 'frontend',
    ext:    ['*'],
  },
];

export default class Dumper {
  constructor() {
    this.pipes = [];
  }

  get mappedPipes() {
    return _.map(this.pipes, pipe => pipe());
  }

  normalizeContext(file) {
    let context = file.context;
    if (!context) {
      context = file.context = {};
    }

    if (!context.type) {
      context.type = this.getTypeOfFile(file.path).name;
    }
  }

  getTypeOfFile(path) {
    // TODO: это плохо
    let ext   = path.split('.').pop()
      , typer = null;
    _.each(types, type => {
      if (type.ext.indexOf(ext) > -1) {
        typer = type;
      }
    });

    if (!typer) {
      _.each(types, type => {
        if (type.name === 'raw') {
          typer = type;
        }
      });
    }

    return typer;
  }

  tagPipe(clb) {
    return through.obj((file, enc, callback) => {
      clb(file);

      callback(null, file);
    });
  }

  getPipe(globs) {
    let pipes = this.mappedPipes.concat(..._.map(globs, glob => {
      return gulp.src(glob.path, {base: glob.base})
        .pipe(this.tagPipe(file => {
          file.context = glob.context;
        }));
    }));

    return merge(...pipes)
      .pipe(this.tagPipe(file => {
        this.normalizeContext(file);
      }))
      .pipe(this.getRenamePipe());
  }

  getPipeFromFile(filePath, glob) {
    return gulp.src(filePath, {base: process.cwd() + '/' + glob.base})
      .pipe(this.tagPipe(file => {
        file.context = glob.context;
      }))
      .pipe(this.getRenamePipe());
  }

  getRenamePipe() {
    return gulpUtil.noop()
      .pipe(rename((path, file) => {
        path.dirname = path.dirname.toLowerCase();

        if (file.context.type === 'raw') {
          path.dirname = path.dirname.replace(/\.raw/g, '');
        }

        if (file.context.rename) {
          file.context.rename.call(file, path);
        }
      }));
  }
}
