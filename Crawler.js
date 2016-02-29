'use strict';

var config = require('nconf'),
    request = require('request'),
    cheerio = require('cheerio'),
    mongoose = require('./mongoose'),
    Vacancy = require('./vacancyModel'),
    moment = require('moment'),
    locks = require('locks');

var Crawler = function() {
    var crawler = this;
}

var initialSemValue = 10;
var sem = locks.createSemaphore(initialSemValue);

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
        if (error){
          console.log(error);
        }
        else{
          console.log(response.statusCode);
        }
      }
    }

    var perPage = 500;
    var year = 2015;
    var a = moment('2016-02-25');
    var b = moment('2016-02-25').add(1, 'days');

    for (var m = a; m.isBefore(b); m.add(1, 'days')) {
      var dateString = 'area=72&date_from=' + m.format('YYYY-MM-DD') + '&date_to=' + m.format('YYYY-MM-DD');
      //for (var area = 1; area < 2526; area++) {
        //for (var page = 0; page < 1; page++) {
        var page=0;
          var options = {
            url: 'https://api.hh.ru/vacancies?per_page=' + perPage + '&page=' +
            page + '&' + dateString,
            headers: { 'User-Agent': 'mail'}
          };
          request(options, saveResult);
      //}
      //}
    }
    return this;
}

module.exports = Crawler;
