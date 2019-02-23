var express = require('express'),
    fs = require('fs'),
    path = require('path'),
    localNI = require('os').networkInterfaces()['eth0'];

module.exports = Framework;

function Framework(options) {
    if (!(this instanceof Framework)) {
        return new Framework(options);
    }

    options = options || {};
    var configFilePath = options.configFilePath;
    if (!configFilePath ) {
        configFilePath = path.join(process.cwd(), 'config.js');
    }

    if (!fs.existsSync(configFilePath)) {
        console.error('cannot find config file "' + configFilePath + '", exit.');
        process.exit(1);
    }

    console.log('load config from ' + configFilePath);

    // load common modules into the global objects.
    global.config = require(configFilePath);
    global.PageRender = require('./common/pageRender');
    global.commonPath = require('./common/commonPath');
    this.config = global.config;

    // set the NODE_ENV.
    process.NODE_ENV = config.env;

    this.appManager = require('./core/appManager');
    this.middlewares = require('./middlewares');
}

Framework.prototype.start = function() {
    // TODO: support global logger
    var config = this.config;
    var expressApp = express();

    if (config.viewOptions) {
        // set view related options.
        expressApp.set('views', config.viewOptions.dir);
        expressApp.set('view engine', config.viewOptions.engine || 'ejs');
        expressApp.set('view options', {layout: false});
    }

    // setup common middlewares.
    this.middlewares(expressApp);

    // setup all apps.
    this.appManager.setup(expressApp, function(err) {
        if (err) {
            console.log('failed to setup apps, error is ' + JSON.stringify(err));
            process.exit(1);
        }

        function onListening() {
            console.log('server is listening on ' + config.port);
        }

        if (config.env === 'development') {
            expressApp.listen(config.port, onListening);
        } else {
            // listen on intranet address.
            localNI = localNI ? localNI[0] : null;
            if (!localNI) {
                throw new Error('Failed to get the local network interface');
            } else {
                expressApp.listen(config.port, localNI.address, onListening);
            }
        }
    });
};

