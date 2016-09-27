var _ = require('lodash');
var config;

function initialize(_config, cb) {
    config = _config;
    cb();
}

function get() {
    return _.cloneDeep(config);
}

module.exports = {
    initialize: initialize,
    get: get
}
