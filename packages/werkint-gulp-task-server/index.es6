'use strict';

import Q from 'q';
import Twig from 'twig';
import express from 'express';
import bodyParser from 'body-parser';

export default context => Q.promise(resolve => {
  resolve(() => Q.promise((resolve, reject) => {
    let config = context.config;

    let app = express();
    app.use(bodyParser.urlencoded({extended: true}));
    app.use(bodyParser.json());
    app.use('/__markup', express.static(__dirname + '/public'));
    app.use('/static', express.static(config.paths.web));
    app.set('views', __dirname + '/views');
    app.set('view engine', 'twig');
    app.set('twig options', {
      //autoescape: true,
    });

    require('./app.js')(config)
      .then(function (appIn) {
        context.emitter.on('reload', () => appIn.loadTwig());

        app.use('/', appIn.router);

        app.listen(config.server.port);
        console.log('Server listening on address ' + config.server.listenPath);
      })
      .fail(function (error) {
        console.log('Error', error);
        reject();
      })
      .done();

    resolve();
  }));
});
