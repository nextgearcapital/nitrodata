var db = require('./db'),
    sqlBuilder = require('./sql_builder');

function getRandom(modelName, cb) {
    var sql = sqlBuilder.getRandomFromTable(modelName);
    db.execQuery(sql, cb);
}

module.exports = getRandom;
