'use strict';

var mongoose = require('mongoose'),
    config = require('./config');

mongoose.connect(config.get('mongoose:uri'), function (error) {
  if (error) {
    console.log(error);
  }
});

var db = mongoose.connection;

db.on('error', function (err) {
  console.log('Connection error:', err.message);
});

db.once('open', function callback () {
	console.log("Connected to DB!");
});

module.exports = mongoose;
