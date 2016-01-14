'use strict';

var nconf = require('nconf');

//constructor
var Crawler = function() {
    var crawler = this;
}

Crawler.prototype.Start = function() {
    console.log("Crawler started.");
    return this;
}

module.exports = Crawler;
