'use strict';
import _ from 'lodash';
import Q from 'q';
import fs from 'fs';
import gulp from 'gulp';
import EventEmitter from 'events';
import {Dumper, Transformer} from 'markup-dumper'
import tasksLoader from './tasks';
import pipesLoader from './pipes';

export default class App {
  constructor(driver, config, resolve) {
    this.emitter = new EventEmitter();

    Q.fcall(_.noop)
      .then(() => this.loadConfig(config))
      .then(() => this.loadDriver(driver))
      .then(() => this.loadPipes())
      .then(() => this.loadDumper())
      .then(() => this.loadTasks())
      .then(() => this.loadGulp())
      .then(() => resolve())
      .fail(er => resolve(er))
      .done();
  }

  get totalPipe() {
    return this.dumper.getPipe(this.driver.globs);
  }

  get globs() {
    return this.driver.globs;
  }

  transform() {
    // TODO
    return this.transformer.transform();
  }

  save() {
    // TODO
    return gulp.dest(this.config.paths.web);
  }

  loadDriver(driverLoader) {
    return Q.promise(resolve => {
      driverLoader(this, driver => {
        this.driver = driver;

        // TODO: remove
        if (this.driver.supports('bower')) {
          this.config.bower.packages = this.driver.bowerPackages;
        }
        resolve(driver);
      })
    });
  }

  loadPipes() {
    return pipesLoader(this)
      .then(pipes => {
        this.pipes = pipes;
      });
  }

  loadTasks() {
    return tasksLoader(this)
      .then(tasks => {
        this.tasks = tasks;
      });
  }

  loadDumper() {
    return Q.promise(resolve => {
      this.dumper = new Dumper();
      this.transformer = new Transformer(this.config, this.pipes);

      resolve();
    })
  }

  loadGulp() {
    return Q.promise(resolve => {
      let dumpDep = this.config.autodump ? ['dump'] : []
        , gulp = this.config.gulp.runner;

      // Dump
      gulp.task('dump', this.tasks.dump);

      // Скачивает и собирает пакеты bower
      gulp.task('bower', this.tasks.bower);

      // Слушает изменения шаблонов, стилей и т.д.
      gulp.task('watch', dumpDep, this.tasks.watch);

      // запускает сервер на express, который рендерит twig-шаблоны
      gulp.task('server', dumpDep, this.tasks.server);

      gulp.task('default', ['watch', 'server']);

      resolve();
    });
  }

  loadConfig(context) {
    return Q.promise(resolve => {
      context.gulp = {
        runner: context.gulp,
      };

      let twigGlobals = require(context.configDir + '/twigGlobals')
        , config = require(context.configDir + '/config');
      this.config = config;
      _.extend(config, context);

      config.server.listenPath = 'http://' + config.server.host + ':' + config.server.port;

      config.twigGlobals = twigGlobals;
      config.twigGlobals.assetPrefix = config.assetPrefix;
      config.twigGlobals.loadScripts = [];

      if (!config.bower.root) {
        config.bower.root = config.root;
      }

      if (config.browserSync) {
        let conf = config.browserSync;
        conf.listenPath = 'http://' + conf.host + ':' + conf.port;
        config.twigGlobals.loadScripts.push(
          conf.listenPath + '/browser-sync/browser-sync-client.js'
        );
      }

      _.each(config.paths, (path, name) => {
        config.paths[name] = fs.realpathSync(config.root + '/' + path);
      });

      resolve();
    })
  }
}
