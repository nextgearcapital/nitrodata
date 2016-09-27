var generate = require('./lib/generate');

generate.getModelsJson(function(err, modelsDef) {
    if (err) {
        console.log(err)
        if (err.toString().indexOf('ECONNREFUSED') >= 0) {
            console.log("please start Nitro server (and your local database) then run: 'node " +  __filename + "'");
            process.exit(1);
        }
        return
    }
    generate.modelsCode(modelsDef, function(err, modelsPath) {
        if (err) {
            console.log(err)
            return
        }
        console.log('wrote models@', modelsPath);
    });
});

