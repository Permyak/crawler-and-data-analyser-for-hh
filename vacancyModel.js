'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Vacancy= new Schema({
	json: { type: Object, required: true },
  elementID: { type: String, required: true, unique: true }
});

module.exports = mongoose.model('Vacancies', Vacancy);
