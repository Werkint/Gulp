'use strict';

var Stream = require('stream');
var Path = require('path');

export default {
  stream: function (obj) {
    var stream = new Stream.Transform({objectMode: true});

    stream._transform = function (file, unused, callback) {
      if (typeof obj !== 'function') {
        callback(new Error('Unsupported renaming parameter type supplied'), undefined);
      }

      file.path = Path.join(file.base, obj(file.relative, file));

      // Rename sourcemap if present
      if (file.sourceMap) {
        file.sourceMap.file = file.relative;
      }

      callback(null, file);
    };

    return stream;
  },

  parsePath: function (path) {
    var extname = Path.extname(path);
    return {
      dirname:  Path.dirname(path),
      basename: Path.basename(path, extname),
      extname:  extname
    };
  },

  joinPath: function (path) {
    return Path.join(path.dirname, path.basename + path.extname);
  },
};
