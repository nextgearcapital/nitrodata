"use strict"

var Promise = require('bluebird'),
    request = require('superagent'),
    join = require('url-join'),
    _ = require('lodash');

var config,
    authToken,
    urls = {
        base: null,
        alps: null,
        models: {},
    };

function init(_config, cb) {
    config = _config;
    urls.base = config.server;
    var authURL = join(urls.base, 'auth', 'login');
    var credentials = JSON.stringify({
        username: _config.user,
        password: _config.password
    });

    //ignore invalid ssl certificates
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

    request.post(authURL)
        .set('Content-Type', 'application/json')
        .send(credentials)
        .end(function (err, results) {
            if (err) {
                console.log('Error while trying to authenticate', err.toString());
                return cb(err);
            }
            //console.log('results', results);
            authToken = results.headers.authorization;
            console.log('authToken', authToken);
            getAlpsUrl(_config.server, function (err, url) {
                if (err) { return cb(err); }
                urls.alps = url;
                cb();
            });
        });
}

function getAlpsUrl(serverURL, cb) {
    request.get(serverURL)
        .set('Content-Type', 'application/json')
        .set('Authorization', authToken)
        .end(function (err, results) {
            if (err) {
                console.log('Error while trying to find ALPS url');
                return cb(err);
            }

            _.forEach(results.body._links, function (modelInfo, modelName) {
                // record urls for later use (creating instances)
                if (modelName !== 'profile') {
                    var hrefAndOptions = modelInfo.href.split('{');
                    urls.models[modelName] = {
                        'href': hrefAndOptions[0],
                        'options': hrefAndOptions[1].replace(/[?}]/g, '').split(',')
                    };
                }

            });
            cb(null, results.body._links.profile.href);
        });
}

function getModels(cb) {
    console.log('downloading models list from:', urls.alps);
    request.get(urls.alps)
        .set('Content-Type', 'application/json')
        .set('Authorization', authToken)
        .end(function (err, results) {
            if (err) {
                console.log('Error while trying to download list of models');
                return cb(err);
            }
            var models = [];
            delete results.body._links['self'];
            _.forEach(results.body._links, function(modelInfo, modelName) {
                modelInfo.name = modelName;
                models.push(modelInfo);
            });
            models = _.sortBy(models, function(m) { return m.name });
            cb(null, models);
        });
}

function getRandomInstance(modelName, cb) {
    // console.log('finding random instance for ', modelName);
    request.get(urls.models[modelName].href)
        .set('Authorization', authToken)
        .end(function (err, results) {
            if (err) {
                console.log('Error while downloading random instance of [' + modelName + ']', err);
                // console.log('url', urls.models[modelName].href);
                // console.log('model', modelName);
                // console.log('res.text', results.text);
                return cb(err);
            }
            var embedded = results.body._embedded[modelName];
            if (embedded.length === 0 ) {
                console.log("Couldn't find any instances of", modelName);
                return cb(null, null);
            }
            var instance = embedded[Math.floor(Math.random() * embedded.length)];
            instance.id = instance._links.self.href;
            console.log('random instance (' + modelName + ')', instance.id);
            cb(null, [instance]);
        });
}

function getId(url) {
    return url.split('/').slice(-1)[0];
}

function getSchema(modelInfo, cb) {
    request.get(modelInfo.href)
        .set('Authorization', authToken)
        .set('Accept', 'application/schema+json')
        .end(function (err, results) {
            if (err) {
                // make this DEBUG level: console.log('WARN: error (', err.message, ') downloading schema for', modelInfo.name);
                return cb(err);
            }

            var schema = results.body.properties;
            request.get(modelInfo.href)
                .set('Authorization', authToken)
                .set('Accept', 'application/alps+json')
                .end(function (err, results) {
                    if (err) {
                        console.log('WARN: error (', err.message, ') downloading representation for', modelInfo.name);
                        return cb(err);
                    }
                    var singularName;
                    var representation;

                    _.forEach(results.body.alps.descriptors, function(d) {
                        if (d.id === undefined) { return; }
                        var idParts = d.id.split('-');
                        if ( idParts.pop() === 'representation' ) {
                            representation = d;
                            singularName = idParts.join('');
                        }
                    });
                    
                    cb(null, {
                        'schema': schema,
                        'model': modelInfo.name,
                        'singularName': singularName,
                        'representation': representation,
                        'url': urls.models[modelInfo.name].href
                    });
                });
        });
}

// connector.insertInstance(modelName, instance, models, cb);
function insertInstance(modelName, instance, models, cb) {
    console.log('insertInstance called with', modelName, instance);
    instance = replaceKeysWithUrls(instance, modelName, models);
    // use url from models.json so that users can override this url.
    var url = models.getModelDef(modelName).url;
    request.post(url)
        .send(instance)
        .set('Authorization', authToken)
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .end(function (err, results) {
            if (err) {
                console.log('WARN: error (', err.message, ') while trying to create a ' + modelName, err.text || err.response.text);
				console.log('http post to:', url);
				console.log('data:');
				console.log(JSON.stringify(instance, null, 4));
                if (err.response && err.response.text) {
                    err.message += ': ' + err.response.text;
                }
                return cb(err);
            }


            fixUpForeignAndId(results.body, modelName, models, function (err, fixedUpInstance) {
                if (err) { return cb(err); }
                cb(null, [fixedUpInstance]);
            });
        });
}

function replaceKeysWithUrls(instance, modelName, models) {
    var modelDef = models.getModelDef(modelName),
        _instance = _.clone(instance);

    _.forEach(_instance, function (value, fieldName) {
        var fieldDef = modelDef.fields[fieldName];
        if ( fieldDef &&
             value &&
             fieldDef.type === 'string:uri' &&
             typeof value === 'string' &&
             value.indexOf('/') === -1
           ) {
            var url = urls.models[fieldDef.targetTable].href + '/' + value;
            _instance[fieldName] = url;
        }
    });
    return _instance;
}

function fixUpForeignAndId(instance, modelName, models, cb) {
    // look for fields defined in the modelDef, but missing on the instance.
    // check _links for missing fields

    var modelDef = models.getModelDef(modelName);
    var attributesToResolve = {};
    _.forEach(modelDef.fields, function (fieldDef, fieldName) {
        if ( !instance.hasOwnProperty(fieldName) &&
             instance._links.hasOwnProperty(fieldName) ) {
                 attributesToResolve[fieldName] = instance._links[fieldName].href;
        }
    });
    attributesToResolve['id'] = instance._links['self'].href;

    resolveAttributes(attributesToResolve, function (err, resolved) {
        if (err) { return cb(err); }
        delete instance._links
        _.assign(instance, resolved);
        cb(null, instance);
    });
}

function resolveAttributes(attributes, cb) {
    var attributePromises = _.mapValues(attributes, function(url) {
        return resolveUrlToIdAsync(url);
    });
    Promise.props(attributePromises)
        .then(function(resolvedAttributes) {
            cb(null, resolvedAttributes);
        })
        .catch(function (err) {
            cb(err);
        });
}

function resolveUrlToId(url, cb) {
    // console.log('resolveUrlToId:', url);
    request.get(url)
    .set('Authorization', authToken)
    .set('Accept', 'application/json')
    .end(function (err, res) {
        if (err) {
            if (err.status === 404) {
                // if api says this doesn't exist, resolve as null
                return cb(null, null);
            } else {
                console.log('WARN: error (', err.message, ') while trying to resolve url (' + url + ') to an id', err);
                return cb(err);
            }
        }
        var id = res.body._links.self.href.split('/').pop();
        cb(null, id);
    });
}
var resolveUrlToIdAsync = Promise.promisify(resolveUrlToId);

module.exports = {
    init: init,
    getModels: getModels,
    getSchema: getSchema,
    getRandomInstance: getRandomInstance,
    insertInstance: insertInstance
}
Promise.promisifyAll(module.exports);
