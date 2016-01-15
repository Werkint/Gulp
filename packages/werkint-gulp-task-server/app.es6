'use strict';
import Q from 'q';
import _ from 'lodash';
import express from 'express';
import Twig from 'twig';
import tree from './util/tree';

const parseBundle = function (name) {
  return name.match(/[A-Z][a-z]+/g).slice(0, -1).join('-').toLowerCase();
};

const App = function (data, views, twigGlobals) {
  this.twigGlobals = twigGlobals;
  this.data = {};
  this.pages = {};
  var loadData = (bundleName, prefixIn, tree) => {
    _.each(tree, node => {
      var prefix = prefixIn + '/' + node.name;

      if (node.data) {
        node.data = JSON.parse(node.data);

        if (node.name.match(/\.twig\.json$/)) {
          var pageName = node.name.split(/\./).slice(-3, -1).join('.'),
              key      = parseBundle(bundleName) + prefixIn + '/' + pageName;

          this.pages[key] = this.parsePage(node, key);
        } else {
          this.data[bundleName + prefix] = node.data;
        }
      } else {
        loadData(bundleName, prefix, node.children);
      }
    });
  };
  _.each(data, function (ns) {
    _.each(ns.children, function (bundle) {
      loadData(ns.name + bundle.name, '', bundle.children);
    });
  });
  _.each(this.pages, page => {
    _.each(page.views, view => {
      view.data = this.parseJson(view.data);
    });
  });

  this.views = {};
  var loadViews = (bundleName, prefixIn, tree) => {
    _.each(tree, node => {
      var prefix = prefixIn + '/' + node.name;

      if (node.data) {
        this.views[bundleName + prefix] = node;
      } else {
        loadViews(bundleName, prefix, node.children);
      }
    });
  };
  _.each(views, function (ns) {
    _.each(ns.children, function (dir) {
      if (dir.name === 'Bundle') {
        _.each(dir.children, function (bundle) {
          var row = bundle.children.Resources;
          if (!(row && row.children)) {
            return;
          }
          row = row.children.views;
          if (!(row && row.children)) {
            return;
          }

          loadViews(parseBundle(ns.name + bundle.name), '', row.children);
        });
      }
    });
  });

  this.loadTwig();

  var router = this.router = express.Router();

  router.get('/', (req, res) => {
    res.render('index.twig', {
      pages: this.pages,
    });
  });

  router.get(/^\/page\/(.+)\/(\d+)(\/(header|body))?/, (req, res) => {
    var page = this.pages[req.params[0]],
        data = {
          page: page,
          view: page.views[req.params[1]],
        };

    if (!req.params[3]) {
      data.url = req.url;
      res.render('page.twig', data);
    } else if (req.params[3] === 'header') {
      res.render('page_header.twig', data);
    } else {
      var tpl = this.twig.twig({
        ref: page.template,
      });
      data.template = tpl.render(this.buildViewConfig(data.view));
      res.render('page_body.twig', data);
    }
  });
};

App.prototype.parseJson = function (data) {
  if (_.isArray(data)) {
    return _.map(data, row => {
      return this.parseJson(row);
    });
  }

  if (_.isObject(data)) {
    var ret = {};
    _.each(data, (val, key) => {
      if (key.substr(-1) === '!') {
        // Do nothing
      } else if (key.substr(-1) === '=') {
        ret[key.substr(0, key.length - 1)] = this.parseJson(
          this.data[val]
        );
      } else {
        ret[key] = this.parseJson(val);
      }
    });
    return ret;
  }

  return data;
};

App.prototype.parseView = function (view, url) {
  var ret = {
    title: view['title!'] || 'Unnamed view',
    url:   url,
    data:  view,
  };

  delete ret['title!'];

  return ret;
};

App.prototype.loadTwig = function () {
  this.twigStore = [];
  this.twig = Twig;

  this.twig.extendFunction('asset', val => '/' + val);
  this.twig.extendFunction('path', val => '#');

  _.each(this.views, (view, name) => {
    // TODO: remove, жуткий костыль
    this.twig.extend(Twig => {
      delete Twig.Templates.registry[name];
    });

    // TODO: remove
    view.data = require('fs').readFileSync(view.path, 'utf8');

    var template = this.twig.twig({
      "id":                  name,
      "data":                view.data,
      "allowInlineIncludes": true,
      "autoescape":          true,
    });

    this.twigStore.push({
      "template": template,
      "name":     name,
    });
  });
};

App.prototype.parsePage = function (pageIn, key) {
  var page = {
    name:     key,
    template: key,
    meta:     pageIn.data.meta,
    views:    _.map(pageIn.data.data, (view, index) => {
      return this.parseView(
        view,
        '/page/' + key + '/' + index
      );
    }),
  };
  page.meta.title = page.meta.title || 'Unnamed page';

  return page;
};

App.prototype.buildViewConfig = function (view) {
  return _.extend({}, this.twigGlobals, view.data);
};

module.exports = function (config) {
  return Q
    .fcall(function () {
      return [
        tree(config.paths.data),
        tree(config.paths.views),
      ];
    })
    .spread(function (data, views) {
      return new App(
        data,
        views,
        config.twigGlobals
      );
    });
};
