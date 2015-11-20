'use strict';

var Q = require('q'),
  fs = require('fs');

var getDirPath = function (dir) {
  return Q.promise(function (resolve, reject) {
    fs.realpath(dir, function (err, resolvedPath) {
      return err ? reject(err) : resolve(resolvedPath);
    });
  });
};

module.exports = getDirPath;
