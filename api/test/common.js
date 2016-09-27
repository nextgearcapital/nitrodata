var should = require('chai').should(); // jshint ignore:line

describe('Common module functionality', function() {
    var common = require('../lib/common.js');
    describe('merge()', function () {
        it('should be: "{x: [{id: 1},{id: 2},{id: 3}], y:[{id: 6},{id: 7},{id: 8},{id: 9}]}" after merging {y: [{id: 7},{id: 9}]} and {x: [{id: 1},{id: 2}, {id:3}], y: [{id: 6},{id: 7}, {id: 8}]}', function () {
            var target = {x: [{id: 1}, {id: 2}, {id:3}], y: [{id: 6}, {id: 7}, {id: 8}]},
            source = {y: [{id: 7},{id: 9}]},
            result = {x: [{id: 1}, {id: 2}, {id: 3}], y:[{id: 6}, {id: 7}, {id: 8}, {id: 9}]};

            common.merge(target, source);

            target.should.deep.equal(result);
        });
    });

    describe('accumulate()', function () {

        it('should be: "{y: [ { z: 999 } ]}" after accumulating [ { z: 999 } ] into {} with modelName "y"', function () {
            var target = {},
            source = [ { z: 999 } ],
            modelName = 'y',
            result = { y: [ { z: 999 } ] };

            common.accumulate(target, source, modelName);

            target.should.deep.equal(result);
        });

        it('should be: "{x: [{id: 1, a:1},{id: 2, b:2},{id: 3, c:3},{id: 4, d:4}]}" after accumulating [ {id: 4, d:4} ] into {x: [{id: 1, a:1},{id: 2, b:2},{id: 3, c:3}]}', function () {
            var target = {x: [{id: 1, a:1},{id: 2, b:2},{id: 3, c:3}]},
            source = [ {id: 4, d:4} ],
            modelName = 'x',
            result = {x: [{id: 1, a:1},{id: 2, b:2},{id: 3, c:3},{id: 4, d:4}]};

            common.accumulate(target, source, modelName);

//console.log('target: %s, result: %s', target, result);
            target.should.eql(result);
        });

        it('should be: "{x: [{id: 1, a:1},{id: 2, bB:2},{id: 3, c:3}]}" after accumulating [ {id: 2, b_b:2} ] into {x: [{id: 1, a:1},{id: 2, bB:2},{id: 3, c:3}]}', function () {
            var target = {x: [{id:1, a:1},{id: 2, bB:2},{id: 3, c:3}]},
            source = [{id: 2, b_b:2}], // jshint ignore:line
            modelName = 'x',
            result = {x: [{id:1, a:1},{id: 2, bB:2},{id: 3, c:3},{id: 2, b_b:2}]}; // jshint ignore:line

            common.accumulate(target, source, modelName);

//console.log('target: %s, result: %s', target, result);
            target.should.eql(result);
        });

    });

    describe('prettifyAccumulator()', function () {
        var models = require('../lib/models');

        it('should be: "{yY: [ { zZ: 999 } ]}" after prettifying accumulator { y_y: [ { z_z: 999 } ] } "', function () {
            var source = { y_y: [ { z_z: 999 } ] },
                result = { yY: [ { zZ: 999 } ] };
 
            models.clobberModels({
                y_y: {
                    prettyName: "yY",
                    fields: {
                        z_z: {
                            prettyName: "zZ"
                        }
                    }
                }
            });

            var target = common.prettifyAccumulator(source, models);

            target.should.deep.equal(result);
        });
    });
});
