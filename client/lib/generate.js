var config = require('../config'),
    swig = require('./initSwig'),
    url = require('url'),
    request = require('requestretry'),
    fstream = require('fstream'),
    fs = require('fs');
    path = require('path'),
    modelsPath = path.join(__dirname, '../generated/models.js'),
    modelsJsonPath = path.join(__dirname, '../generated/models.json');

function getModelsJson(cb) {
    var models_url = url.resolve(config.server_url, 'models.json')
    console.log('downloading models at:', models_url);
    request(models_url, function (err, results) {
        if (err) {
            return cb(err)
        }
        var modelsJson = results.body;
        fs.writeFile(modelsJsonPath, modelsJson, function (err) {
            if (err) {
                return cb(err)
            }
            return cb(null, JSON.parse(modelsJson));
        });
    });
}

function modelsCode(modelDefs, cb) {
    var templateName = 'client_models.js.swig';

    if ( modelDefs.meta.defaultNamespace === 'disabled' ) {
        templateName = 'client_models_without_namespaces.js.swig'
    }

    var clientModelCode = swig.renderFile(
        path.join(__dirname, 'templates', templateName), modelDefs);

    var stream = fstream.Writer({
        path: modelsPath,
        mode: '0755'
    });
    stream.on('close', cb.bind(null, null, modelsPath));
    stream.on('error', cb);
    stream.write(clientModelCode);
    stream.end();
}


module.exports = {
    modelsCode: modelsCode,
    getModelsJson: getModelsJson
}

