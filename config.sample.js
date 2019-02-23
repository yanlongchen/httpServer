var path = require('path');
module.exports = {
    'env': 'production',
    'port': '8888',
    'languageOptions': {
        'availables': ['zh-cn'],
        'default': 'zh-cn'
    },
    'rootDir': __dirname,
    'viewOptions': {
        'dir': path.join(__dirname, 'views/')
    },
    'commonDir': path.join(__dirname, 'common/'),
    'assetsDir': path.join(__dirname, 'assets/'),
    'appsDir': path.join(__dirname, 'apps/'),
    'clientOptions': {
        'appIdentifier': 'meme'
    }
};
