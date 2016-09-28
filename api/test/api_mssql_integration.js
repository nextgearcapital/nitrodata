'use strict';
var should = require('chai').should(); // jshint ignore:line


// var logging = require('../lib/logging');
//     logging.config({'level': 'debug'});
// var logger = logging.getDefault();

describe('API', function () {
    var request = require('supertest');
    var mocker = require('./misc/mockDb');
    var execQueryResult = [{"notTested": "notNeededForTest"}];
    var execParameterizedQueryResult = [{"notTested": "notNeededForTest"}];

    beforeEach(mocker.beforeMock(execQueryResult, execParameterizedQueryResult));
    afterEach(mocker.afterMock);

    describe('/createRecords', function () {
        it('should respond to a POST by calling db.execParameterizedQuery', function (done) {
            var execQueryResult = [];
            var execParameterizedQueryResult = {
                "user": [{
                    "firstName": "Lil Bobby",
                    "lastName": "Tables",
                    "phone": "6954704540",
                    "company": "AcmeCorporation",
                    "type": "employee"
                }]
            };

            var app = mocker.getAppWithMockDb(execQueryResult, execParameterizedQueryResult);

            var postData = {
                'model': 'user',
                'attributes': {
                    'first_name': 'Lil Bobby',
                    'last_name': 'Tables',
                    'phone': '6954704540',
                    'company': 'AcmeCorporation',
                    'type': 'employee'
                }
            };

            // note - mocking breaks the query that retrieves the response value
            var expectedResponse = '{"user":[]}';
            var expectedInsert = 'CREATE TABLE #T ( first_name varchar(255) ); INSERT INTO [user] ';
            expectedInsert += '("first_name", "last_name", "phone", "company", "type") OUTPUT INSERTED.first_name INTO #T ';
            expectedInsert += 'VALUES (@first_name, @last_name, @phone, @company, @type); SELECT * FROM [user] WHERE first_name = (SELECT first_name FROM #T); DROP TABLE #T';

            request(app)
                .post("/createRecords")
                .send(postData)
                .expect(200)
                .expect(expectedResponse)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    var mockDb = mocker.getMockDb();
                    var call = mockDb.execParameterizedQuery.getCall(0);
                    var queryParams = call.args[1];
                    call.args[0].should.equal(expectedInsert);
                    queryParams[0].should.deep.equal(['first_name', 'varchar', 'Lil Bobby']);
                    queryParams[4].should.deep.equal(['type', 'employee']);
                    done();
                });
        });
    });

    describe("/findRecords", function () {
        it('should respond to a GET by calling db.execQuery', function (done) {
            var execQueryResult = [{
                "first_name": "Sir Robert",
                "last_name": "Tables",
                "phone": "6954704540",
                "company": "AcmeCorporation",
                "type": "employee"
            }];
            var execParameterizedQueryResult = [{"notTested": "notNeededForTest"}];

            var app = mocker.getAppWithMockDb(execQueryResult, execParameterizedQueryResult);

            var postData = {
                'model': 'user',
                'attributes': {
                    'last_name': 'Tables'
                },
                'count': 1
            };

            var expectedResponse = '{"user":[{"firstName":"Sir Robert","lastName":"Tables","phone":"6954704540","company":"AcmeCorporation","type":"employee"}]}';
            var expectedFindSql = "SELECT TOP 1 * FROM user  WHERE last_name = 'Tables' ORDER BY NEWID()";

            request(app)
                .get("/findRecords")
                .send(postData)
                .expect(200)
                .expect(expectedResponse)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    var mockDb = mocker.getMockDb();
                    var call = mockDb.execQuery.getCall(0);
                    call.args[0].should.equal(expectedFindSql);
                    done();
                });
        });
    });

    describe("/updateRecords", function () {
        it('should respond to a POST by calling db.execQuery', function (done) {
            var execQueryResult = [{
                "first_name": "Sir Robert",
                "last_name": "Tables",
                "phone": "6954704540",
                "company": "AcmeCorporation",
                "type": "employee"
            }];
            var execParameterizedQueryResult = [{"notTested": "notNeededForTest"}];

            var app = mocker.getAppWithMockDb(execQueryResult, execParameterizedQueryResult);

            var postData = {
                'model': 'user',
                'attributes': {
                    'first_name': 'Sir Robert'
                },
                'where': 'last_name = \'Tables\'',
                "count": 1
            };

            var expectedResponse = '{"user":[{"firstName":"Sir Robert","lastName":"Tables","phone":"6954704540","company":"AcmeCorporation","type":"employee"}]}';
            var expectedUpdateSql = "CREATE TABLE #T ( first_name varchar(255) ); UPDATE user SET first_name = 'Sir Robert' OUTPUT INSERTED.first_name INTO #T  WHERE last_name = 'Tables'; SELECT upd.* FROM user upd INNER JOIN #T ON upd.first_name = #T.first_name; DROP TABLE #T";

            request(app)
                .post("/updateRecords")
                .send(postData)
                .expect(200)
                .expect(expectedResponse)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    var mockDb = mocker.getMockDb();
                    var call = mockDb.execQuery.getCall(0);
                    call.args[0].should.equal(expectedUpdateSql);
                    done();
                });
        });
    });

    describe("/deleteRecords", function () {

        it('should respond to a POST by calling db.execQuery', function (done) {
            // logger.debug("starting /deleteRecords");


            var app = mocker.getAppWithMockDb();

            var postData = {
                'model': 'user',
                'attributes': {
                    'first_name': 'Sir Robert'
                },
                "count": 1
            };

            var expectedResponse = '"record: deleted"';
            var expectedDeleteSql = "DELETE user  WHERE first_name = 'Sir Robert'";

            request(app)
                .post("/deleteRecords")
                .send(postData)
                .expect(200)
                .expect(expectedResponse)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    var mockDb = mocker.getMockDb();
                    var call = mockDb.execQuery.getCall(0);
                    call.args[0].should.equal(expectedDeleteSql);
                    done();
                });
        });
    });

});
