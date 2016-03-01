'use strict';

var Indexer = require('./indexer'),
    Index = require('./indexModel');

var Searcher = function() {
    var indexer = this;
}

var indexer = new Indexer();

Searcher.prototype.Search = function(query, minSalary, maxSalary, res) {
    var searchLemQuery = function(err, data){


      var dataString = lemFormatToString(data);
      Index.where('word').in(dataString)
      .limit(50)
      .populate('docIndex.id')
      .then(function returnIndex(docs){
        var resultArray= [];
        for (var i = 0; i < docs.length; i++) {
          for (var j = 0; j < docs[i].docIndex.length; j++) {
            if (isSalaryInRange(docs[i].docIndex[j].id[0].json.salary, minSalary, maxSalary)){
              resultArray.push(docs[i].docIndex[j]);
            }
          }
        }
        sendResultToClient(res, resultArray);
      });
    };

    indexer.Lemmatizate(indexer.RemoveStopWords(indexer.ClearSentence(query)), searchLemQuery);
}

Searcher.prototype.SearchByKey = function(query, minSalary, maxSalaryres, res) {
    var searchLemQuery = function(err, data){
      var dataString = lemFormatToString(data);
      Index.where('word').in(dataString)
      .limit(50)
      .populate('docIndex.id')
      .then(function returnIndex(docs){
        var resultArray= [];
        for (var i = 0; i < docs.length; i++) {
          for (var j = 0; j < docs[i].docIndex.length; j++) {
            if (docs[i].docIndex[j].tfidf > 1
            && isSalaryInRange(docs[i].docIndex[j].id[0].json.salary, minSalary, maxSalary)){
              resultArray.push(docs[i].docIndex[j]);
            }
          }
        }
        sendResultToClient(res, resultArray);
      });
    }

    indexer.Lemmatizate(indexer.RemoveStopWords(indexer.ClearSentence(query)), searchLemQuery);
}

var sendResultToClient = function(res, resultArray){
  res.setHeader('Content-Type', 'application/json');
  res.json(JSON.stringify(
  { status: 200,
    success: "Send Successfully",
    count: resultArray.length,
    result: resultArray
  }));
}

var lemFormatToString = function(data){
  var dataString =[];
  for (var i = 0; i < data.length; i++) {
    dataString.push(data[i].toString());
  }
  return dataString;
}

var isSalaryInRange = function(salaryArray, minSalary, maxSalary){
  if (minSalary == null && maxSalary == null){
    return true;
  }
  return salaryArray && salaryArray.from && salaryArray.to
      && (minSalary < salaryArray.from || maxSalary > salaryArray.to)
      && salaryArray.currency === 'RUR';
}

module.exports = Searcher;
