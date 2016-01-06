'use strict';
import glob from 'glob';
import through from 'through2';
import fs from 'fs';
import path from 'path';
import Twig from 'twig';
import gutil from 'gulp-util';
import _ from 'lodash';
var twig = Twig.twig
  , PluginError = gutil.PluginError;

/**
 * Created by Grigory Kotov and Vladimir Doba
 * patched by Bogdan Yurov
 */

/*
 * Change Twig to add additional compile options
 * (main feature: parse dependencies and add ones in requirejs define arguments)
 */

Twig.cache(false);

Twig.extend(function (Twig) {
  /*
   * Add ability of loading inline templates
   */
  Twig.compiler.wrap = function (id, tokens) {
    id = id.split("\\").join("/");
    return 'var autoGeneratedData = {id:"' + id.replace('"', '\\"') + '", allowInlineIncludes: true, data:' + tokens + ', autoescape: true, precompiled: true};\n\n';
  };
  /*
   * When compile amd module (that is all we can...) pass additional arguments (template, options)
   */
  Twig.compiler.compile = function (template, options) {
    // Get tokens
    var tokens = JSON.stringify(template.tokens),
      id = template.id,
      output;

    if (options.module) {
      if (Twig.compiler.module[options.module] === undefined) {
        throw new Twig.Error("Unable to find module type " + options.module);
      }
      output = Twig.compiler.module[options.module](id, tokens, options.twig, template, options);
    } else {
      output = Twig.compiler.wrap(id, tokens);
    }
    return output;
  };
  /*
   * Customize Twig errors
   */
  Twig.log = {
    trace: function () {
      if (Twig.trace) {
        gutil.log(gutil.colors.grey(Array.prototype.slice.call(arguments)));
      }
    },
    debug: function () {
      if (Twig.debug) {
        gutil.log(gutil.colors.grey(Array.prototype.slice.call(arguments)));
      }
    },
    error: function () {
      gutil.log(gutil.colors.grey(Array.prototype.slice.call(arguments)));
    }
  };
  /*
   * Inject in parsing and get static (not evaluated!) template dependencies
   */
  var overrideOld = {},
    override = function (name, i) {
      overrideOld[name] = Twig.logic.handler[name].compile;
      Twig.logic.handler[name].compile = function (token) {
        var match = token.match,
          expression = match[i].trim();
        if (!this.compiliationMetadata) {
          this.compiliationMetadata = [];
        }
        this.compiliationMetadata.push(expression);
        return overrideOld[name].apply(this, arguments);
      };
    };
  override('Twig.logic.type.extends', 1);
  override('Twig.logic.type.include', 2);
  override('Twig.logic.type.use', 1);
  override('Twig.logic.type.import', 1);

  /*
   * There is Main work
   */
  Twig.compiler.module.amd = function (id, tokens, pathToTwig, template, options) {
    var requiredViews = [];
    // * *  old way of getting extend
    //try {
    //    Twig.parse.apply(template, [template.tokens, {}])
    //} catch (e) {
    //    gutil.log(gutil.colors.red('while compiling ' + id + ' was error'), e);
    //}
    //if (template.extend) {
    //    requiredViews.push(template.extend);
    //}

    requiredViews = requiredViews.concat(_.map(template.compiliationMetadata, function (file) {
      return file && (file.indexOf('"') > -1 || file.indexOf('\'') > -1) && file.replace(/^['"]/, '').replace(/['"]$/, '');
    }));

    /* amd requireds */
    var requireds = _.map(_.filter(requiredViews, function (file) {
      if (!file) {
        return false;
      }
      var isOk = options.compileOptions.willCompile && _.indexOf(options.compileOptions.willCompile, file) !== -1;
      isOk = isOk || _.some(options.compileOptions.lookPaths, function (lookPath) {
          // TODO: bullshit
          var fileName = path.join(__dirname, lookPath, file);
          return fs.existsSync(fileName);
        });
      if (!isOk) {
        //gutil.log(gutil.colors.yellow('while compiling ' + id + ' can\'t find template: ') + file);
      }
      return true;
    }), function (v, i) {
      return '"' + options.compileOptions.viewPrefix + v + '"';
    });
    requireds.unshift('"' + pathToTwig + '"');

    requireds = _.uniq(requireds).join(', ');
    return 'define([' + requireds + '], function (Twig) {\n\tvar twig = Twig.twig, template;\n'
      + Twig.compiler.wrap(id, tokens) + '\ttemplate = twig(autoGeneratedData);\n\ttemplate._autoGeneratedData = autoGeneratedData;//in case You want pass some options\n\treturn function(data){return template.render(data)};\n});';
  };
});

module.exports = function (opt) {
  //opt.compileOptions.willCompile = glob.sync(opt.compileOptions.lookPaths[0]);
  function transform(file, enc, cb) {
    if (file.isNull()) {
      return cb(null, file);
    }
    if (file.isStream()) {
      return cb(new PluginError('gulp-twig-compile', 'Streaming not supported'));
    }

    var options = _.merge({
      module:           'amd',
      twig:             'twig',
      'compileOptions': {
        viewPrefix: '',
      }
    }, opt);
    var data;
    try {
      // TODO: remove, жуткий костыль
      Twig.extend(Twig => {
        delete Twig.Templates.registry[file.relative];
      });
      var template = twig({
        id: file.relative,
        data: file.contents.toString('utf8'),
        allowInlineIncludes: true,
        autoescape: true,
      });
     // console.log(template);
      data = template.compile(options);
    } catch (err) {
      return cb(new PluginError('gulp-twig-compile', err));
    }

    file.contents = new Buffer(data);
    file.path = file.path + '.js';

    cb(null, file);
  }

  return through.obj(transform);
};