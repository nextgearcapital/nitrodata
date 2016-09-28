'use strict';

var should = require('chai').should(); // jshint ignore:line

describe.skip('SQL Builder', function () {
    //var SqlBuilder = require('../lib/sql_builder');
    //var models = require('../lib/models');

    describe('createParameterizedInsert', function () {
        it('should create a parameterized sql statement for model', function () {
            var instance = {
                'first_name': 'Lil Bobby',
                'last_name': 'Tables',
                'phone': '6954704540',
                'company': 'AcmeCorporation',
                'type': 'employee'
            };
            var correctSql = 'CREATE TABLE #T ( last_name varchar(10) ); INSERT INTO "user" ("first_name", "last_name", "phone", "company", "type") OUTPUT INSERTED.last_name INTO #T VALUES (@first_name, @last_name, @phone, @company, @type); SELECT * FROM user WHERE last_name = (SELECT last_name FROM #T); DROP TABLE #T';
            models.clobberModels({
                user: {
                    fields: {
                        'last_name': {
                            value: {
                                default: "bob"
                            },
                            maxLength: 10,
                            type: "varchar",
                            isNullable: false,
                            isIdentity: false,
                            isPrimaryKey: true
                        }
                    }
                }
            });

            SqlBuilder.createParameterizedInsert(models, 'user', instance).should.equal(correctSql);
        });
    });
    describe('getRandomFromTable', function () {
        it('should create a sql statement returning random row for table', function () {

            var correctSql = "SELECT TOP 1 * FROM user_accounts ORDER BY NEWID()";

            SqlBuilder.getRandomFromTable('user_accounts').should.equal(correctSql);
        });
    });
    describe('updateRow', function () {
        it('should create a sql statement updating a row for a table', function () {
            models.clobberModels({
                user: {
                    fields: {
                        'last_name': {
                            value: {
                                default: "tables"
                            },
                            maxLength: 10,
                            type: "varchar",
                            isNullable: false,
                            isIdentity: false,
                            isPrimaryKey: true
                        },
                        'first_name': {
                            value: {
                                default: "bob"
                            },
                            maxLength: 10,
                            type: "varchar",
                            isNullable: false
                        }
                    }
                }
            });

            var modelName = 'user',
                instance = {'first_name': 'SqlBuilder\'\'s Detail'},
                where = "last_name = 'tables'";

            var correctSql = "CREATE TABLE #T ( last_name varchar(10) ); UPDATE user SET first_name = 'SqlBuilder''s Detail' OUTPUT INSERTED.last_name INTO #T  WHERE last_name = 'tables'; SELECT upd.* FROM user upd INNER JOIN #T ON upd.last_name = #T.last_name; DROP TABLE #T";
            SqlBuilder.updateRow(models, modelName, instance, where).should.equal(correctSql);
        });
    });
});
