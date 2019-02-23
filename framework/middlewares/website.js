var MobileDetect = require('mobile-detect');
var _ = require('lodash');

module.exports = function(expressApp) {
    expressApp.use(initialize);
};

var languageOptions = global.config.languageOptions;
var appIdentifier = global.config.clientOptions.appIdentifier;

function getClientInfo(req) {
    var client = req.client || {};

    var language = req.headers['user-language'];
    if (language) {
        if (language.indexOf('en-') >= 0) {
            language = 'en';
        }
    }

    language = _.find(languageOptions.availables, function(i) {
        return i === language;
    });

    if (!language) {
        var url = req.originalUrl;
        if (url.length > 0) {
            var words = url.split('/');
            if (words.length > 1) {
                var lang = words[1].toLowerCase();
                _.forEach(languageOptions.availables, function(i) {
                    if (i === lang) {
                        language = lang;
                        req.url = url.substr(('/' + lang).length) || '/';
                        return false;
                    }
                });
            }
        }
    }
    
    client.language = language || languageOptions.default;

    var md = new MobileDetect(req.headers['user-agent']);
    if (md.mobile()) {
        client.isMobile = true;
    } else if (req.headers['user-agent'] &&
        req.headers['user-agent'].toLowerCase().indexOf(appIdentifier) !== -1) {
            client.isMobile = true;
    }

    return client;
}

function initialize(req, res, next) {
    req.client = getClientInfo(req);
    
    // language specified base url.
    res.locals.baseUrl = '';
    if (req.client.language !== languageOptions.default) {
        res.locals.baseUrl = '/' + req.client.language;
    }

    res.locals.currentUrl = req.url;

    req.isApiCall = req.url.indexOf('/api/') === 0;

    res.sendJson = function(options) {
        options = options || {};
        res.status(options.statusCode || 200);
        return res.json(options.data);
    };

    // no cache.
    res.setHeader('Cache-Control', 'max-age=0, no-cache');
    res.setHeader('Pragma', 'no-cache');

    next();
}
