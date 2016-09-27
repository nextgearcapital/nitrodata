var faker = require('faker'),
    _ = require('lodash'),
    moment = require('moment');

var birthdate = {
    adult: function () {
        return faker.date.between(moment().subtract(80, 'y')._d, moment().subtract(18, 'y')._d);
    },
    child: function () {
        return faker.date.between(moment().subtract(18, 'y')._d, moment().subtract(1, 'd')._d);
    }
};

module.exports = {
    faker: faker,
    _: _,
    moment: moment,
    birthdate: birthdate
};
