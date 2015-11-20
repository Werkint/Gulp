'use strict';

var Q = require('q'),
  fs = require('fs'),
  path = require('path'),
  getDirPath = require('./getDirPath');

var readDir = function (dir) {
  return Q.promise(function (resolve, reject) {
    var results = {};

    fs.readdir(dir, function (err, list) {
      if (err) {
        return reject(err);
      }

      var pending = list.length;

      if (!pending) {
        return resolve({
          name:     path.basename(dir),
          type:     'folder',
          children: results,
        });
      }

      list.forEach(function (file) {
        file = path.resolve(dir, file);
        fs.stat(file, function (err, stat) {
          if (stat && stat.isDirectory()) {
            readDir(file)
              .then(function (result) {
                results[path.basename(file)] = {
                  name:     path.basename(file),
                  path:     file,
                  children: result,
                };
                if (!--pending) {
                  resolve(results);
                }
              })
              .fail(reject)
              .done();
          } else {
            fs.readFile(file, 'utf8', function (err, data) {
              if (err) {
                return reject(err);
              }

              results[path.basename(file)] = {
                name: path.basename(file),
                path: file,
                data: data,
              };
              if (!--pending) {
                resolve(results);
              }
            });
          }
        });
      });
    });
  });
};

module.exports = function (dir) {
  return getDirPath(dir)
    .then(function (dir) {
      return readDir(dir);
    });
};
