'use strict';

var Indexer = require('./indexer'),
    Index = require('./indexModel'),
    Vacancy = require('./vacancyModel');

var Searcher = function() {
    var indexer = this;
}

var indexer = new Indexer();

var boolOps = ['не', 'или', 'и'];

var sendResultToClient = function(res, resultArray){
  res.setHeader('Content-Type', 'application/json');
  res.json(JSON.stringify(
  { status: 200,
    success: "Send Successfully",
    count: resultArray.length,
    result: resultArray
  }));
}

var lemFormatToArray = function(data){
  var dataArray =[];
  for (var i = 0; i < data.length; i++) {
    dataArray.push(data[i].toString());
  }
  return dataArray;
}

var hasKeywords = function(doc, keywords, j){
  if (keywords){
    var nonExist = true;
    var k = 0;
    while (nonExist && k < keywords.length){
      if (keywords[k++] == doc.word)
        nonExist = false;
    }
    return !nonExist && doc.docIndex[j].tfidf > 1
  }
  else
    return true
}

var isSalaryInRange = function(salaryArray, minSalary, maxSalary){
  if (minSalary == null && maxSalary == null){
    return true;

  }
  return salaryArray && salaryArray.from && salaryArray.to
      && minSalary > salaryArray.from && maxSalary < salaryArray.to
      && salaryArray.currency === 'RUR';
}

var unique  = function(array) {
   var o = {}, i, l = array.length, r = [];
   for(i=0; i<l;i++) o[array[i]] = array[i];
   for(i in o) r.push(o[i]);
   return r;
}

var intersectArray = function(arr1, arr2) {
  var res = [];
  for (var i=0; i < arr1.length; i++){
    if (arr2.indexOf(arr1[i]) != -1){
        res.push(arr1[i]);
    }
  }
  return res;
}

var boolSearch = function(err, data){
  var query = infixToRpn(data),
      op1,
      op2,
      stack = [],
      docs;
  console.log(query);

  var queryIterateFunction = function(data){
    if (data){
      if (data.length == 1){
        stack.push(unique(data[0].docIndex.map(function(index) {
          return index.id[0].elementID;
        })));
      }
      else{
        stack.push(data.map(function(index) {
          return index.elementID;
        }))
      }
    }
    console.log("Query = ", query);
    if (query.length){
      var elem = query.shift()
      console.log("log = " + elem);

      if (boolOps.indexOf(elem) >= 0){
        if (elem == "и"){
          if (stack.length < 2){
            console.log("Result = ", stack.pop());
            return
          }
          else{
            op1 = stack.pop();
            op2 = stack.pop();
            stack.push(intersectArray(op1, op2));
            queryIterateFunction();
          }
        }
        else if (elem == "или"){
          if (stack.length < 2){
            console.log("Result = ", stack.pop());
          }
          else{
            op1 = stack.pop();
            op2 = stack.pop();
            stack.push(unique(op1.concat(op2)));
            queryIterateFunction();
          }
        }
        else if (elem == "не"){
          op1 = stack.pop();
          op2 = stack.pop();
          stack.push(op2.filter(function inArray(value) {
            return op1.indexOf(value) == -1;
          }));
          queryIterateFunction();
        }
      }
      else{
        Index.find({ 'word': elem })
        .populate('docIndex.id')
        .then(queryIterateFunction);
      }
    }
    else{
      console.log("Result = ", stack.pop().length);
    }
  }

  if (query.indexOf("не")!=-1){
    Vacancy.find({}, 'elementID').then(queryIterateFunction);
  }
  else{
    queryIterateFunction()
  }
}

var infixToRpn = function(data){
  var result = [],
      stack = [],
      isWords = false;
  for (var i = 0; i < data.length; i++) {
    var lemma = data[i].toString();
    if (boolOps.indexOf(lemma) >= 0){
      isWords = false;
      while (stack.length
          && boolOps.indexOf(stack[stack.length-1]) < boolOps.indexOf(lemma) ){
        result.push(stack.pop());
      }
      stack.push(lemma);
    }
    else{
      if(isWords){
        stack.push("или")
      }
      isWords = true;
      result.push(lemma);
    }
  }

  while (stack.length){
    result.push(stack.pop());
  }

  return result;
}

Searcher.prototype.Search = function(query, minSalary, maxSalary, res, keywords) {
    var boolSearch = function(err, data){
      var query = infixToRpn(data),
          op1,
          op2,
          stack = [],
          docs = [];
      if (keywords)
        for (var i = 0; i < keywords.length; i++) {
          query.push("или")
          query.push(keywords[i])
        }
      console.log(query);

      var queryIterateFunction = function(data){
        if (data){
          if (data.length == 1){
            stack.push(unique(data[0].docIndex.map(function(index) {
              return index.id[0].elementID;
            })));
          }
          else{
            docs = data.map(function(index) {
              return index.elementID;
            })
          }
        }
        console.log("Query = ", query);
        if (query.length){
          var elem = query.shift()
          console.log("log = " + elem);

          if (boolOps.indexOf(elem) >= 0){
            if (elem == "и"){
              if (stack.length < 2){
                resultId = stack.pop();
                console.log("Result = ", resultId);
                selectAndSend();
              }
              else{
                op1 = stack.pop();
                op2 = stack.pop();
                stack.push(intersectArray(op1, op2));
                queryIterateFunction();
              }
            }
            else if (elem == "или"){
              if (stack.length < 2){
                resultId = stack.pop();
                console.log("Result = ", resultId);
                selectAndSend();
              }
              else{
                op1 = stack.pop();
                op2 = stack.pop();
                stack.push(unique(op1.concat(op2)));
                queryIterateFunction();
              }
            }
            else if (elem == "не"){
              op1 = stack.pop();
              console.log(docs.length);
              stack.push(docs.filter(function inArray(value) {
                return op1.indexOf(value) == -1;
              }));
              queryIterateFunction();
            }
          }
          else{
            Index.find({ 'word': elem })
            .populate('docIndex.id')
            .then(queryIterateFunction);
          }
        }
        else{
          resultId = stack.pop();
          console.log("Result = ", resultId);
          selectAndSend();
        }
      }

      if (query.indexOf("не")!=-1){
        Vacancy.find({}, 'elementID').then(queryIterateFunction);
      }
      else{
        queryIterateFunction()
      }
    }

    var querii = function(query){
      console.log(query);
      indexer.Lemmatizate(indexer.RemoveStopWords(indexer.ClearSentence(query), false), boolSearch);
    }

    var searchLemQuery = function(err, data){
      queryData = data
      querii(query);
    };

    var selectAndSend = function(){
      var dataString = lemFormatToArray(queryData);

      console.log(dataString);
      if (keywords)
        for (var i = 0; i < keywords.length; i++) {
          dataString.push(keywords[i])
        }
      console.log("datas " + dataString);

      Index.where('word').in(dataString)
      .limit(50)
      .populate('docIndex.id')
      .then(function returnIndex(docs){
        console.log(docs.length);
        var resultArray= [];
        for (var i = 0; i < docs.length; i++) {
          for (var j = 0; j < docs[i].docIndex.length; j++) {
            if (resultId.indexOf(docs[i].docIndex[j].id[0].elementID) != -1
                && hasKeywords(docs[i], keywords, j)
                && isSalaryInRange(docs[i].docIndex[j].id[0].json.salary, minSalary, maxSalary)){
              var nonExist = true;
              var k = 0;
              while (nonExist && k < resultArray.length){
                if (resultArray[k++].id[0].json.id == docs[i].docIndex[j].id[0].json.id)
                  nonExist = false;
              }
              if (nonExist)
                resultArray.push(docs[i].docIndex[j]);
            }
          }
        }
        sendResultToClient(res, resultArray);
      });
    }

    var resultId = [];
    var queryData;

    indexer.Lemmatizate(indexer.RemoveStopWords(indexer.ClearSentence(query)), searchLemQuery);
}

module.exports = Searcher;
