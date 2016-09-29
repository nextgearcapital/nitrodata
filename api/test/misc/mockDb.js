'use strict';

module.exports = function () {
    var mockery = require('mockery');
    var sinon = require('sinon');
    //var _ = require('lodash');
    
    var requireParameterToMock = './db'; 

    function initMockDb(execQueryResult, execParameterizedQueryResult) {
        var mockDb = {};

        //function execQuery(query, cb) returns (err, result) - create stub that does the callback with the result
        var execQuery = sinon.stub();
        execQuery.callsArgWith(1, null, execQueryResult);    
        mockDb.execQuery = execQuery;

        //function execParameterizedQuery(query, params, cb) returns (err, result) - create stub that does the callback with the result
        var execParameterizedQuery = sinon.stub();
        execParameterizedQuery.callsArgWith(2, null, execParameterizedQueryResult);
        mockDb.execParameterizedQuery = execParameterizedQuery;

        mockDb.getConfig = function() {
            return { options: {
                encryption_key: "MyKey",
                encryption_cert: "MyCertificate" }
            }
        };

        return mockDb;
    }

    function resetMockDbResults(execQueryResult, execParameterizedQueryResult) {
        var mockDb = require(requireParameterToMock);
        if (mockDb.execQuery.callsArgWith) {
            mockDb.execQuery.callsArgWith(1, null, execQueryResult);
        }
        if (mockDb.execParameterizedQuery.callsArgWith) {
            mockDb.execParameterizedQuery.callsArgWith(2, null, execParameterizedQueryResult);
        }    
    }

    function initMockeryWithCleanCache(mockDb) {
        mockery.enable({
            warnOnReplace: true,
            warnOnUnregistered: false,
            useCleanCache: true,
        });
        // _.each(require.cache, function (mod) {
        //     console.log('** before registerMock: require.cache includes %s, parent %s', mod.id, (mod.parent === null) ? 'null' : mod.parent.id);
        // });
        mockery.deregisterMock(requireParameterToMock);
        mockery.registerMock(requireParameterToMock, mockDb);
        // _.each(require.cache, function (mod) {
        //     console.log('++  after registerMock: require.cache includes %s, parent %s', mod.id, (mod.parent === null) ? 'null' : mod.parent.id);
        // });
        var app = getAppWithMockDb();
        return app;
    }

    function getAppWithMockDb(execQueryResult, execParameterizedQueryResult) {
        if (execQueryResult !== undefined && execParameterizedQueryResult !== undefined) {
            resetMockDbResults(execQueryResult, execParameterizedQueryResult);
        }
        var app = require('../../lib/express_app')();
        var models = require('../../lib/models');
        models.clobberModels({
            user: {
                prettyName: 'user',
                fields: {
                    'first_name': {
                        value: {
                            default: "bob"
                        },
                        maxLength: 255,
                        type: "varchar",
                        isNullable: false,
                        isIdentity: false,
                        isPrimaryKey: true,
                        prettyName: "firstName",
                    },
                    'last_name': {
                        prettyName: "lastName",
                    },
                    'phone': {
                        prettyName: "phone",
                    },
                    'company': {
                        prettyName: "company",
                    },
                    'type': {
                        prettyName: "type",
                    }
                }
            },
            user_with_ssn: { // jshint ignore:line
                prettyName: 'userWithSsn',
                fields: {
                    'first_name': {
                        value: {
                            default: "bob"
                        },
                        maxLength: 255,
                        type: "varchar",
                        isNullable: false,
                        isIdentity: false,
                        isPrimaryKey: true,
                        prettyName: "firstName",
                    },
                    'last_name': {
                        prettyName: "lastName",
                    },
                    'phone': {
                        prettyName: "phone",
                    },
                    'company': {
                        prettyName: "company",
                    },
                    'type': {
                        prettyName: "type",
                    },
                    'ssn': {
                        prettyName: "type",
                        isEncrypted: true,
                    }
                }
            }

        });
        
        return app;
    }

    function beforeMock(execQueryResult, execParameterizedQueryResult) {
        return function () {
            var mockDb = initMockDb(execQueryResult, execParameterizedQueryResult);
            initMockeryWithCleanCache(mockDb);
        };
    }

    function afterMock(done) {
        mockery.deregisterAll();
        mockery.disable();
        done();
    }
    
    function getMockDb() {
        var mock = require(requireParameterToMock);
        return mock; 
    }
    
    return {
        getAppWithMockDb: getAppWithMockDb,
        beforeMock: beforeMock,
        afterMock: afterMock,
        getMockDb: getMockDb,
    };
}();

