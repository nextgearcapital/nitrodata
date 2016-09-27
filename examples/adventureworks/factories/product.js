'use strict';

var _ = require('lodash');
var faker = require('faker');
var moment = require('moment');
var nitro = require('nitro-client');
var m = nitro.nsModels;

var letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
var randomChar = function() { return letters.charAt(_.random(0,25)) }

function randomProductNumber() {
    var number = _.random(100, 9999);
    return randomChar() + randomChar() + '-' + randomChar() + number;
}

function generic() {
    return m.Production.Product()
        .withProductNumber(randomProductNumber())
        .withWeightUnitMeasureCode('KG')
        .withSizeUnitMeasureCode('EA')
        .withSafetyStockLevel(1)
        .withDiscontinuedDate(null);
}

function recentlyDiscontinued() {
    var now = moment();
    var yesterday = now.subtract(1, 'days');
    var fiveMinutesAgo = now.subtract(5, 'minutes');

    return generic()
        .withSellEndDate(yesterday.toDate())
        .withDiscontinuedDate(fiveMinutesAgo.toDate());
}


module.exports = {
    generic: generic,
    recentlyDiscontinued: recentlyDiscontinued
};

