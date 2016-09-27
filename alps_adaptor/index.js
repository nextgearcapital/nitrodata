var Promise = require('bluebird'),
    generateAllModels = require('./lib/generate_all_models'),
    connector = require('./lib/connector'),
    getRandom = require('./lib/getRandom'),
    insert = require('./lib/insert').insert;
    findRecords = require('./lib/find_records');

module.exports = {
    generateAllModels: generateAllModels,
    init: connector.init,
    getRandom: getRandom,
    findRecords: findRecords,
    updateRecords: null,
    deleteRecords: null,
    insertRecord: insert
}
Promise.promisifyAll(module.exports);
