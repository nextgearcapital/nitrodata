'use strict';
var should = require('chai').should(); // jshint ignore:line


// var logging = require('../lib/logging');
//     logging.config({'level': 'debug'});
// var logger = logging.getDefault();

describe('API (encrypted fields)', function () {
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
                "userWithSsn": [{
                    "firstName": "Lil Bobby",
                    "lastName": "Tables",
                    "phone": "6954704540",
                    "company": "AcmeCorporation",
                    "type": "employee"
                }]
            };

            var app = mocker.getAppWithMockDb(execQueryResult, execParameterizedQueryResult);

            var postData = {
                'model': 'user_with_ssn',
                'attributes': {
                    'first_name': 'Lil Bobby',
                    'last_name': 'Tables',
                    'phone': '6954704540',
                    'company': 'AcmeCorporation',
                    'type': 'employee',
                    'ssn': '999449999'
                }
            };

            // note - mocking breaks the query that retrieves the response value
            var expectedResponse = '{"userWithSsn":[]}';
            var expectedInsert = 'CREATE TABLE #T ( first_name varchar(255) );  OPEN SYMMETRIC KEY DSCKey DECRYPTION BY CERTIFICATE DSCCertificate; ' +
                'INSERT INTO [user_with_ssn] ("first_name", "last_name", "phone", "company", "type", "ssn") OUTPUT INSERTED.first_name INTO #T ' +
                'VALUES (@first_name, @last_name, @phone, @company, @type, EncryptByKey(Key_GUID(\'DSCKey\'), CONVERT(VARBINARY(300), @ssn))); ' +
                'SELECT *, decrypted_ssn = CONVERT(varchar(50), DECRYPTBYKEYAUTOCERT(cert_ID(\'DSCCertificate\'), NULL, ssn)) ' +
                'FROM [user_with_ssn] WHERE first_name = (SELECT first_name FROM #T); DROP TABLE #T';

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
                'model': 'user_with_ssn',
                'attributes': {
                    'last_name': 'Tables',
                    'ssn': '999449999'
                },
                'count': 1
            };

            var expectedResponse = '{"userWithSsn":[{"firstName":"Sir Robert","lastName":"Tables","phone":"6954704540","company":"AcmeCorporation","type":"employee"}]}';
            var expectedFindSql = "SELECT TOP 1 *, decrypted_ssn = CONVERT(varchar(50), " +
                "DECRYPTBYKEYAUTOCERT(cert_ID('DSCCertificate'), NULL, ssn)) FROM user_with_ssn  " +
                "WHERE last_name = 'Tables' ORDER BY NEWID()";

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
                'model': 'user_with_ssn',
                'attributes': {
                    'first_name': 'Sir Robert',
                    'ssn': '999559999'
                },
                'where': 'last_name = \'Tables\'',
                "count": 1
            };

            var expectedResponse = '{"userWithSsn":[{"firstName":"Sir Robert","lastName":"Tables","phone":"6954704540","company":"AcmeCorporation","type":"employee"}]}';
            var expectedUpdateSql = "CREATE TABLE #T ( first_name varchar(255) );  " +
                "OPEN SYMMETRIC KEY DSCKey DECRYPTION BY CERTIFICATE DSCCertificate; " +
                "UPDATE user_with_ssn SET first_name = 'Sir Robert', ssn = EncryptByKey(Key_GUID('DSCKey'), CONVERT(VARBINARY(300), '999559999')) " +
                "OUTPUT INSERTED.first_name INTO #T  WHERE last_name = 'Tables'; " +
                "SELECT upd.*, decrypted_ssn = CONVERT(varchar(50), DECRYPTBYKEYAUTOCERT(cert_ID('DSCCertificate'), NULL, upd.ssn)) " +
                "FROM user_with_ssn upd INNER JOIN #T ON upd.first_name = #T.first_name; DROP TABLE #T";

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
                'model': 'user_with_ssn',
                'attributes': {
                    'first_name': 'Sir Robert',
                    'ssn': '999449999'
                },
                "count": 1
            };

            var expectedResponse = '"record: deleted"';
            var expectedDeleteSql = "DELETE user_with_ssn  WHERE first_name = 'Sir Robert'";

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
