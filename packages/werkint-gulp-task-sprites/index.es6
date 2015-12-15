'use strict';
import _ from 'lodash';
import Q from 'q';
import spritesmith from 'gulp.spritesmith';
import gulp from 'gulp';
import imageResize from 'gulp-image-resize';
import stylesTemplate from './css.template';

export default app => Q.promise(resolve => {
  let template = stylesTemplate();
  let pipeLoader = sprite => Q.promise((resolve, reject) => gulp.src(sprite.src)
    .pipe(imageResize({
      width:       sprite.size.width,
      height:      sprite.size.height,
      upscale:     true,
      imageMagick: true,
      crop:        true,
      format:      'png',
    }))
    .pipe(spritesmith({
      imgName:     sprite.name + '.png',
      cssName:     sprite.name + '.css',
      algorithm:   'top-down',
      cssTemplate: template,
      cssOpts:     {
        prefix: sprite.name.replace('/', '-'),
      },
    }))
    .pipe(app.save())
    .on('end', resolve)
    .on('error', reject));

  resolve(() => Q.all(_.map(app.config.sprites, sprite => Q.fcall(() => sprite)
    .then(pipeLoader))));
});
