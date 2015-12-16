'use strict';

import Q from 'q';
import fs from 'fs';
import _ from 'lodash';
import glob from 'glob';

let types = [ // TODO: remove
  {
    root:   true,
    name:   'stylesheet',
    prefix: 'styles',
    ext:    ['css', 'less', 'sass', 'scss'],
  }, {
    name:   'stylesheet',
    prefix: 'frontend',
    ext:    ['css'],
  }, {
    name:   'script',
    prefix: 'frontend',
    ext:    ['js', 'es6', 'json'],
  }, {
    name:   'script',
    prefix: 'views',
    ext:    ['js', 'es6', 'json'],
  }, {
    name:   'image',
    prefix: 'frontend',
    ext:    ['jpg', 'jpeg', 'gif', 'svg', 'png'],
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

class Driver {
  constructor(app, resolve) {
    this.app = app;

    Q.fcall(_.noop)
      .then(() => this.rebuildBundles(this.app.config.configDir + '/bundles.json'))
      .then(() => {
        console.log(
          'Symfony driver loaded.',
          this.bundles.length,
          'bundles loaded'
        );
      })
      .then(() => resolve())
      .fail(er => resolve(er))
      .done();
  }

  supports(type) {
    return type === 'bower';
  }

  get bowerPackages() {
    return _.chain(this.bundles)
      .filter(bundle => bundle.bower)
      .map(bundle => ({
        name: bundle.name,
        path: bundle.bower,
      }))
      .value();
  }

  get globs() {
    var list = [];

    _.each(this.bundles, bundle => {
      _.each(bundle.globs, glob => {
        list.push(glob);
      })
    });

    return list;
  }

  get sprites() {
    var list = [];

    _.each(this.bundles, bundle => {
      try {
        let path = bundle.path + '/Resources/sprites';
        _.each(fs.readdirSync(path), file => {
          list.push({
            src:  path + '/' + file + '/**/*.png',
            name: bundle.name + '/' + file,
            size: {
              width:  92,
              height: 92,
            },
          });
        })
      } catch (e) {
      }
    });

    return list;
  }

  rebuildBundles(path) {
    return Q.promise((resolve, reject) => {
      fs.readFile(path, (err, result) => {
        if (err) {
          return reject(err);
        }

        this.bundles = JSON.parse(result);
        _.each(this.bundles, bundle => {
          bundle.globs = this.__getBundleGlobs(bundle);
          bundle.bower = this.app.config.root + '/' + bundle.path + '/bower.json';
        });

        Q.all(_.map(this.bundles, bundle => Q.promise((resolve, reject) => {
          fs.stat(bundle.bower, (error, stat) => {
            if (error || !stat.isFile()) {
              bundle.bower = false;
            }

            resolve();
          });
        }))).then(() => {
          this.rebuildConfig(); // sync
          this.rebuildFiles().done(resolve);
        }).done();
      });
    });
  }

  rebuildConfig() {
    // TODO: di
    let config = this.app.config.pipes['stylesheet'];

    config.includePaths = _.filter(config.includePaths, path => {
      return !path.isBundle;
    }).concat(_.map(this.bundles, bundle => {
      return {
        isBundle: true,
        path:     bundle.path + '/Resources/styles',
      };
    }));

    this.app.config.sprites = this.app.config.sprites.concat(this.sprites);
  }

  rebuildFiles() {
    return Q.promise((resolve, reject) => {
      this.files = [];

      let loaders = _.map(this.bundles, bundle => {
        return Q.all(_.map(bundle.globs, row => {
          return Q.promise((resolve, reject) => {
            glob(row.base + '/' + row.glob, (err, filesList) => {
              if (err) {
                return reject(err);
              }

              _.each(filesList, file => {
                this.files.push({
                  name:    file,
                  base:    row.base,
                  context: row.context,
                });
              });
              resolve();
            });
          });
        }));
      });

      Q.all(loaders)
        .fail(reject)
        .done(resolve);
    });
  }

  __getBundleGlobs(bundle) {
    var root = bundle.path + '/Resources/';

    let multiple = val => '+(' + val.join('|') + ')';

    return _.map(types, type => {
      let ret = {
        glob: '**/*.' + multiple(this.app.config.types[type.name]),
        base: root + type.prefix,
        type: type.name,

        context: {
          root:   type.root,
          type:   type.name,
          bundle: bundle,
          rename: Driver.__bundleRename,
        },
      };

      if (type.name === 'raw') {
        ret.path = ret.base + '/**/*.raw' + ret.glob;
      } else {
        ret.path = [
          ret.base + '/' + ret.glob,
          '!' + root + '/**/*.raw/**/*.*',
          '!' + root + '/**/_old/**/*.*'
        ];
      }

      return ret;
    });
  }

  static __bundleRename(path) {
    if (!this.context.root) {
      let reg = /^__root(\/(.+))?$/;
      path.dirname = path.dirname.match(reg) ?
        path.dirname.replace(reg, '$2') :
      this.context.bundle.name + '/' + path.dirname;
    }
  }
}

export default function (app, done) {
  let driver = new Driver(app, () => done(driver));
}
