'use strict';

import gutil from 'gulp-util';
import gulpif from 'gulp-if';
import merge from 'multipipe';
import normalizer from 'gulp-bower-normalize';
import Path from 'path';
import rename from './rename';

let getComponents = file => {
  var relativePath = file.relative;
  var pathParts = Path.dirname(relativePath).split(Path.sep);

  var ret = {
    ext:         Path.extname(relativePath).substr(1), // strip dot
    filename:    Path.basename(relativePath),
    packageName: pathParts[0],
  };
  pathParts.shift();
  ret.path = pathParts.join('/');

  return ret;
};

export default config => {
  let normalizerOptions = {
    bowerJson: config.targetFile,
    flatten:   true,
  }
    , renames           = config.data.overrides.renames || {}
    , ignored           = config.data.overrides.ignored || []
    , defaultPrefix     = 'js';// TODO: tmp

  let notInIgnored = file => {
    file.pathComponents = getComponents(file);

    return !ignored[file.pathComponents.packageName];
  };

  return merge(
    gulpif(notInIgnored, normalizer(normalizerOptions), rename.stream((pathIn, file) => {
      let path = rename.parsePath(pathIn);

      // Переносим пакеты целиком
      path.dirname = Path.join(
        defaultPrefix,
        file.pathComponents.path
      );

      return rename.joinPath(path);
    })),
    rename.stream(relativePath => {
      let path = relativePath;
      path = path.replace(/^(js|es|es6)(\/(.+))?$/, '$3');

      if (renames[path]) {
        return renames[path];
      }

      path = rename.parsePath(path);
      if (renames[path.basename]) {
        path.basename = renames[path.basename];
      }

      return rename.joinPath(path);
    })
  );
};
