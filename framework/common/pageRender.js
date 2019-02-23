var fs = require('fs');
var path = require('path');
var _ = require('lodash');

module.exports = PageRender;

var defaultLanguage = global.config.languageOptions.default;
var env = global.config.env;
var viewDir = global.config.viewOptions.dir;
var suffix = global.config.env === 'development' ? '/views/' : '/';

function PageRender(appName) {
    if (!(this instanceof PageRender)) {
        return new PageRender(appName);
    }

    this.base = appName + suffix;
}

function _commonViewPath(path) {
    if ('development' === env) {
        return global.commonPath('views/' + path);
    } else {
        return path.join(viewDir, 'common/', path);
    }
}

PageRender.prototype.render = function(req, res, page, model) {
    var that = this;
    model = model || {};
    model.commonViewPath = _commonViewPath;
    
    var prefixes = [];
    var language = req.client.language;
    if (language != defaultLanguage) {
        prefixes.push(defaultLanguage + '/');

        if (req.client.isMobile) {
            prefixes.push(defaultLanguage + '/mobile/');
        }
    }

    prefixes.push(language + '/');
    if (req.client.isMobile) {
        prefixes.push(language + '/mobile/');
    }

    var prefix = that.base;
    _.forEachRight(prefixes, function(item){
        item = that.base + item;
        var fullPath = path.join(viewDir, item + (/\.ejs$/i.test(page) ? page : page + '.ejs'));
        if (fs.existsSync(fullPath)) {
            prefix = item;
            return false;
        }
    });

    page = prefix + page;
    return res.render(page, model);
};
