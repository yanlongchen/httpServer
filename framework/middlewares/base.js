var logger = require('morgan');
var bodyParser = require('body-parser');

function clientInfo(req, res, next) {
    var client = req.client || {};
    if (req.headers['x-forwarded-for']) {
        client.ip = req.headers['x-forwarded-for'].split(',')[0];
    }

    if (!client.ip) {
        client.ip = req.headers['x-real-ip'] || req.ip;
    }

    if (req.headers['x-forwarded-proto']) {
        client.protocol = req.headers['x-forwarded-proto'].split(',')[0];
    }

    if (!client.protocol) {
        client.protocol = req.protocol;
    }

    req.client = client;
    return next();
}

module.exports = function(expressApp) {
    // eliminate warnings.
    var config = global.config;

    // get client info.
    expressApp.use(clientInfo);

    // TODO: favicon
    
    // logger middleware
    logger.token('client-ip', function(req) {
        return req.client.ip;
    });
    expressApp.use(logger(':client-ip - [:date[clf]] :method :url :status :response-time ms - :res[content-length] ":user-agent"'));

    // body parser.
    expressApp.use(function(req, res, next) {
        // body-parser does not think the utf8 is a valid encoding... 
        if (req.headers['content-type']) {
            req.headers['content-type'] = req.headers['content-type'].replace('charset=utf8', 'charset=utf-8');
        }

        return next();
    });

    expressApp.use(bodyParser.json({'limit': '1mb'}));
    expressApp.use(bodyParser.urlencoded({'extended': false}));
};
