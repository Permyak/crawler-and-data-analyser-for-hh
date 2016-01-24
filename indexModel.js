'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var docIndexSchema = new Schema({
  id: [{type: Schema.Types.ObjectId, ref: 'Vacancies' }],
  place: { type: String },
  position: { type: Number }
});

var reverseIndex = new Schema({
	word: { type: String, required: true },
  docIndex: [docIndexSchema]
});

module.exports = mongoose.model('ReverseIndex', reverseIndex);
