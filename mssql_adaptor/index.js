var Promise = require('bluebird'),
    generateAllModels = require('./lib/generate_all_models'),
    getRandom = require('./lib/getRandom'),
    findRecords = require('./lib/find_records'),
    updateRecords = require('./lib/update_records'),
    deleteRecords = require('./lib/delete_records'),
    insertRecord = require('./lib/insert_record'),
    db = require('./lib/db');

module.exports = {
    generateAllModels: generateAllModels,
    init: db.connectToDb,
    getRandom: getRandom,
    findRecords: findRecords,
    updateRecords: updateRecords,
    deleteRecords: deleteRecords,
    insertRecord: insertRecord
}
Promise.promisifyAll(module.exports);
