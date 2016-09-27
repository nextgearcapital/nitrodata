var connector = require('./connector');

module.exports = function findRecords(instanceReqs, models, cb) {
    // FIXME TODO is there a way to search the alps api?
    // for now all searches return empty, forcing nitro to insert fresh data
    cb(null, []);
}
