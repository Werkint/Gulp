'use strict';
import fs from 'fs';
import _ from 'lodash';
import handlebars from 'handlebars';

export default () => {
  let tpl = fs.readFileSync(__dirname + '/css.template.hbs', 'utf8');

  return data => {
    let opts = data.options
      , prefix = opts.prefix ? '-' + opts.prefix : '';

    _.each(data.sprites, sprite => {
      _.extend(sprite, {
        selector: '.sprite' + prefix + '.' + sprite.name,
        pos:      {
          x: 0,
          y: (sprite.y) / (data.spritesheet.height - sprite.height) * 100,
        },
      })
    })

    return handlebars.compile(tpl)(data);
  };
}
