'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var docIndexSchema = new Schema({
  id: [{type: Schema.Types.ObjectId, ref: 'Vacancies' }],
  place: { type: String },
  position: { type: Number },
  tf: { type: Number },
  tfidf: { type: Number }
});

var reverseIndex = new Schema({
	word: { type: String, required: true, index: { unique: true }},
  docIndex: [docIndexSchema],
  idf: { type: Number }
});

module.exports = mongoose.model('ReverseIndex', reverseIndex);
