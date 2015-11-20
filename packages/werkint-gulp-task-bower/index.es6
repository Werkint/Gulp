'use strict';

import _ from 'lodash';
import Q from 'q';
import fs from 'fs'
import gulp from 'gulp';
import mainFiles from 'main-bower-files';
import bower from 'gulp-bower';
import merge from 'merge-stream';
import clean from 'gulp-clean';
import gulpIgnore from 'gulp-ignore';
import glob from 'glob';
import consume from 'stream-consume';
import normalizer from './normalizer';

let getOverrides = config => {
  let loadFiles = (files) => {
    let list = [];
    return Q
      .all(_.map(files, file => {
        return Q.promise((resolve, reject) => {
          fs.readFile(file, (er, data) => {
            if (er) {
              return reject(er);
            }

            resolve(list.push({
              name: file,
              data: data,
            }));
          })
        })
      }))
      .then(() => list);
  };

  return Q.promise((resolve, reject) => {
    glob(config.root + '/' + config.target + '/*/' + config.overridesName, (er, files) => {
      if (er) {
        return reject(er);
      }

      loadFiles(files)
        .then(list => resolve(_.map(list, row => JSON.parse(row.data))))
        .fail(reject)
        .done();
    });
  });
};

let normalizeData = data => {
  if (!data.dependencies) {
    data.dependencies = {};
  }
};

let updateDataFile = (config) => {
  return getOverrides(config)
    .then(overrides => Q.promise((resolve, reject) => {
      _.merge(config.data.overrides, ...overrides);
      let target = config.root + '/' + config.targetFile
        , data = JSON.stringify(config.data);
      fs.writeFile(target, data, (err, result) =>
        err ? reject(err) : resolve(config));
    }));
};

let updatePipes = (app, config) => {
  app.dumper.pipes = _.filter(app.dumper.pipes, pipe => !pipe.isBower);

  config.pipe = () => gulp
    .src(mainFiles({
      paths: {
        bowerDirectory: config.root + '/' + config.target,
        bowerJson:      config.root + '/' + config.targetFile,
        bowerrc:        '.bowerrc',
      }
    }), {
      base: config.target, // TODO: absolute
    })
    .pipe(gulpIgnore.exclude('**/' + config.overridesName))
    .pipe(gulpIgnore.exclude('**/bower.json'))
    .pipe(normalizer(config));
  config.pipe.isBower = true;
  app.dumper.pipes.push(config.pipe);
};

let myFunc = (app, config) => {
  // сохраняем bower.json
  return updateDataFile(config)
    // Для dump добавляем в пайп файлы bower
    .then(() => updatePipes(app, config))
    .then(() => config);
};

export default app => Q.promise((resolve, reject) => {
  Q.fcall(() => app.config.bower)
    // Читаем главный bower.json, обрабатываем данные
    .then(config => Q.promise((resolve, reject) => {
      fs.readFile(config.root + '/' + config.mainFile, (err, result) => {
        if (err) {
          return reject(err);
        }

        config.data = JSON.parse(result);
        normalizeData(config.data);
        resolve(config);
      });
    }))

    // Добавляем все зависимости
    .then(config => Q.promise((resolve, reject) => {
      _.each(config.packages, row => {
        config.data.dependencies[row.name] = row.path;
      });

      resolve(config)
    }))

    .then(config => myFunc(app, config))

    .then(config => resolve(() => Q.fcall(() => null)
      // Удаляем пакеты (они не обновляются автоматом)
      .then(() => Q.promise((resolve, reject) =>
        merge(..._.map(config.packages, row => gulp
          .src(config.target + '/' + row.name, {read: false})))
          .pipe(clean())
          .on('finish', resolve)
          .on('error', reject)))
      // Ставим зависимости
      .then(() => Q.promise((resolve, reject) =>
        consume(bower({
          cmd:       'install',
          directory: config.target,
        }, [
          //'-q', TODO: quietb
        ])
          .on('finish', () => {
            myFunc(app, config)
              .then(() => resolve())
              .fail(reject)
              .done();
          })
          .on('error', reject))))

      // Удаляем bower.json
      .then(() => Q.promise((resolve, reject) => {
        fs.unlink(config.root + '/' + config.targetFile, err => err ? reject(err) : resolve)
      }))))
    .fail(er => reject(er))
    .done();
});
