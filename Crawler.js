'use strict';

var config = require('nconf'),
    request = require('request'),
    cheerio = require('cheerio'),
    mongoose = require('./mongoose'),
    Vacancy = require('./vacancyModel'),
    moment = require('moment');

var Crawler = function() {
    var crawler = this;
}

Crawler.prototype.Start = function() {
    function saveResult(error, response, data) {
      if (!error && response.statusCode == 200) {
        var elements = JSON.parse(data);
        if (elements.found>2000){
          console.log('found>2000');
        }
        for (var i = 0; i < elements.items.length; i++) {
          var vacancy = new Vacancy({
            json: elements.items[i],
            elementID: elements.items[i].id
          });
          vacancy.save(function (err, item) {
            if (!err){
              console.log('Save new vacancy', item.elementID);
            }
            else{
              if (err.code===11000){
                console.log('Duplicate');
              }
              else {
                console.log("Error", err);
              }
            }
          });
        };
      }
      else{
        console.log(error);
      }
    }
    var perPage = 500;
    var year = 2015;
    var a = moment('2015-12-01');
    var b = moment('2016-01-01');

    for (var m = a; m.isBefore(b); m.add(1, 'days')) {
      var dateString = 'date_from=' + m.format('YYYY-MM-DD') + '&date_to=' + m.format('YYYY-MM-DD');
      //for (var area = 1; area < 2526; area++) {
        for (var page = 0; page < 4; page++) {
          var options = {
            url: 'https://api.hh.ru/vacancies?per_page=' + perPage + '&page=' +
            page + '&' + dateString,
            headers: { 'User-Agent': 'mail' }
          };
          console.log(options.url);
          request(options, saveResult);
        }
      //}
    }

    return this;
}

module.exports = Crawler;
