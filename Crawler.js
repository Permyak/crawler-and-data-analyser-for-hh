'use strict';

var nconf = require('nconf'),
    request = require('request'),
    cheerio = require('cheerio');

//constructor
var Crawler = function() {
    var crawler = this;
}

Crawler.prototype.Start = function() {
    var options = {
      url: 'https://api.hh.ru/vacancies?per_page=5',
      headers: {
        'User-Agent': 'request'
      }
    };

    function callback(error, response, data) {
      if (!error && response.statusCode == 200) {
        var elements = JSON.parse(data);
        for (var item in elements.items) {
          console.log(elements.items[item].id);
        };
      }
      else{
        console.log(error);
      }
    }

    request(options, callback);

    return this;
}

module.exports = Crawler;
