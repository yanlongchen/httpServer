var express = require('express');
var base = require('./base');
var website = require('./website');
var config = global.config;

module.exports = function(expressApp) {
    base(expressApp);
    website(expressApp);

    // TODO: use OSS and CDN if we hit performance issue here.
    expressApp.use(express.static(config.assetsDir));
};
