var fs = require('fs');
var path = require('path');
var _ = require('lodash');
var async = require('async');

var appsDir = global.config.appsDir;
var commonDir = global.config.commonDir;
var env = global.config.env;

exports.setup = setup;

function App(manifest, expressApp) {
    if (!(this instanceof App)) {
        return new App(manifest);
    }

    this.manifest = manifest;
    this.expressApp = expressApp;
}

App.prototype.setMiddlewares = function() {
    var args = [];
    var paths = [];
    if (this.manifest.base) {
        paths.push(this.manifest.base);
        paths.push('/api' + this.manifest.base);
        args.push(paths);
    }

    if (this.manifest.middlewares &&
        this.manifest.middlewares.length > 0) {
            this.manifest.middlewares.forEach(function(middleware){
                args.push(middleware);
            });

            this.expressApp.use.apply(this.expressApp, args);
    }
};

App.prototype.setServices = function() {
    var that = this;
    function setupEndpoint(endpoint, isApi) {
        var args = [];
        var base = '';
        if (isApi) {
            base += '/api';
        }

        if (that.manifest.base) {
            base += that.manifest.base;
        }

        if(/[\/\\]$/.test(base)) {
            base = base.substring(0, base.length - 1);
        }

        if(!/^[\/\\]/.test(endpoint.path)) {
            endpoint.path = '/' + endpoint.path;
        }

        args.push(base + endpoint.path);

        _.each(endpoint.middlewares, function(middleware){
            args.push(middleware);
        });

        args.push(endpoint.service);

        var method = endpoint.method && endpoint.method.toLowerCase();
        if (!isApi && !method) {
            method = 'get';
        }

        var fn = that.expressApp[method];
        fn.apply(that.expressApp, args);
    }

    _.each(this.manifest.apis, function(api){
        setupEndpoint(api, true);
    });

    _.each(this.manifest.pages, function(page){
        setupEndpoint(page);
    });
};

App.prototype.setup = function() {
    this.setMiddlewares();
    this.setServices();
};

// setup all apps.
function setup(expressApp, callback) {
    if (!callback) {
        callback = function(err) {
            if (err) {
                console.log('failed to setup apps, error is ' + err);
                process.exit(1);
            }
        };
    }

    var common = path.join(commonDir, 'index.js');
    var preSetup, postSetup;
    if (fs.existsSync(common)) {
        var commonModule = require(common);
        preSetup = commonModule.preSetup;
        postSetup = commonModule.postSetup;
    }

    var context = {
        expressApp: expressApp
    };

    function _preSetup(callback) {
        if (!preSetup) {
            return callback();
        }

        return preSetup(context, callback);
    }

    function _postSetup(callback) {
        if (!postSetup) {
            return callback();
        }

        return postSetup(context, callback);
    }

    var errorHandler;
    _preSetup(function(err) {
        if (err) {
            return callback(err);
        }

        async.each(fs.readdirSync(appsDir), function(appDir, callback){
            // only enable example app on dev env.
            if (appDir === 'example') {
                if (env != 'development') {
                    return callback();
                }
            }

            var entry = path.join(appsDir, appDir, 'index.js');
            if (!fs.existsSync(entry)) {
                console.warn('skip ' + entry + ', since it does not have index file.');
                return callback();
            }

            // error handler.
            if (appDir === 'error') {
                errorHandler = require(entry);
                return callback();
            }

            var initializer = require(entry);
            initializer(context, function(err, manifest) {
                if (err) {
                    return callback(err);
                }

                try {
                    (new App(manifest, expressApp)).setup();
                } catch (e) {
                    return callback(e);
                }

                return callback();
            });
        }, function(err){
            if (err) {
                return callback(err);
            }

            if (errorHandler) {
                // setup the error handler.
                expressApp.use(errorHandler);
            }

            return _postSetup(callback);
        });
    });
}
