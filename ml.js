var Vacancy = require('./vacancyModel'),
    Index = require('./indexModel'),
    brain = require('brain'),
    clusterfck = require("clusterfck"),
    regression = require("regression");
var prompt = require('prompt');

var Ml = function() {
    var indexer = this;
}

var TrainCount = 500;

var net = new brain.NeuralNetwork({
  hiddenLayers: [10, 10],
  learningRate: 0.6 // global learning rate, useful when training using streams
});

Ml.prototype.Association = function() {
  var data = [],
      keywords = [];
  Index.find().populate('docIndex.id')
  .then(function buildData(docs){
    console.log(docs.length);
    for (var i = 0; i < docs.length; i++) {
      for (var j = 0; j < docs[i].docIndex.length; j++) {
        var doc = docs[i].docIndex[j];
        if (doc.tfidf > 1
            && doc.id[0].json.salary
            && doc.id[0].json.salary.from
            && doc.id[0].json.salary.to){
          var salary = (doc.id[0].json.salary.from + doc.id[0].json.salary.to) / 2;
          var notExist = true,
            k = 0,
            elem ={};
          while ( notExist && k < data.length ) {
            if (data[k++].id == doc.id[0].elementID){
              notExist = false;
            }
          }
          if (notExist){
            elem.id = doc.id[0].elementID;
            elem.word = []
            elem.word.push(docs[i].word);
            elem.salary = salaryToString(salary);
            data.push(elem);
          }
          else{
            data[k-1].word.push(docs[i].word);
          }
        }
      }
    }
    console.log(data.length);
    console.log(data);

    var elements = data.map(function(record) {
      var elementList = [];
      for (var j = 0; j < record.word.length; j++) {
        elementList.push(record.word[j]);
      }
      elementList.push(record.salary);
      return elementList;
    });
    for (var i = 0; i < elements.length; i++) {
      console.log(i, ") ", elements[i]);
    }

    var keywordsArray = {};
    for (var i = 0; i < elements.length; i++) {
      for (var j = 0; j < elements[i].length; j++) {
        if (!keywordsArray[elements[i][j]]){
          keywordsArray[elements[i][j]] = [];
        }
        if (keywordsArray[elements[i][j]].indexOf(i) == -1){
          keywordsArray[elements[i][j]].push(i)
        }
      }
    }

    var filteredKeywordsCount = filterObjectValues(keywordsArray, 1)
    console.log(filteredKeywordsCount);

    var keys = Object.keys(filteredKeywordsCount);
    var selectedItemsets = [];
    for (var i = 0; i <keys.length; i++) {
      for (var j = i + 1; j < keys.length; j++) {
        var intersectionArray = intersection(filteredKeywordsCount[keys[i]], filteredKeywordsCount[keys[j]]);
        if (intersectionArray.length > 1){
          var itemset = {};
          itemset.keys = [];
          itemset.keys.push(keys[i]);
          itemset.keys.push(keys[j]);
          itemset.set = intersectionArray;
          selectedItemsets.push(itemset);
        }
      }
    }
    console.log(selectedItemsets);

    var newSelectedItemsets = [];
    for (var i = 0; i <selectedItemsets.length; i++) {
      for (var j = i + 1; j < selectedItemsets.length; j++) {
        var intersectionArray = intersection(selectedItemsets[i].set, selectedItemsets[j].set);
        if (intersectionArray.length > 1){
          var newSet = {};
          newSet.keys = [];
          newSet.set = [];
          newSet.keys = arrayUnique(selectedItemsets[i].keys.concat(selectedItemsets[j].keys));

          var k = 0,
              isExist=false;
          while (k<newSelectedItemsets.length && !isExist) {
            if (compareArrays(newSelectedItemsets[k++].keys, newSet.keys)){
              isExist =true;
            }
          }
          if (isExist){
            newSelectedItemsets[k-1].set = arrayUnique(newSelectedItemsets[k-1].set.concat(intersectionArray));
          }
          else{
            newSet.set = intersectionArray;
            newSelectedItemsets.push(newSet);
          }
        }
      }
    }
    console.log(newSelectedItemsets);
  });
}

function intersection(array1, array2){
  return array1.filter(function(n) {
           return array2.indexOf(n) != -1;
         });
}

function arrayUnique(array) {
    var a = array.concat();
    for(var i=0; i<a.length; ++i) {
        for(var j=i+1; j<a.length; ++j) {
            if(a[i] === a[j])
                a.splice(j--, 1);
        }
    }

    return a;
}

function compareArrays(array1, array2) {
  return array1.length === array2.length &&
          array1.every(function(item, index) {
              return array2.indexOf(item) > -1;
          });
}


var filterObjectValues = function (object, filterValue){

  var filteredKeywordsCount = {};
  Object.keys(object).forEach(function(key) {
    if (object[key].length > filterValue){
      filteredKeywordsCount[key] = object[key]
    }
  });
  return filteredKeywordsCount;
}

function salaryToString(salary){
  if (salary<24500)
    return "$мизерная"
  else if (24500<=salary && salary<30500)
    return "$маленькая"
  else if (30500<=salary && salary<40000)
    return "$средняя"
  else if (40000<=salary && salary<100000)
    return "$большая"
  else if (100000<=salary)
    return "$огромная"
}

Ml.prototype.Regression = function() {
  Vacancy.find().where("json.salary").ne(null).
  where('json.salary.currency').equals('RUR')
  .limit(1000)
  .skip(0).then(function buildData(docs){
    console.log(docs.length);
    var data = [];
    for (var i = 0; i < docs.length; i++) {
      var textLength = docs[i].json.name.length
      if (docs[i].json.snippet.responsibility)
        textLength += docs[i].json.snippet.responsibility.length;
      if (docs[i].json.snippet.requirement)
        textLength += docs[i].json.snippet.requirement.length;
      var salaryJson = docs[i].json.salary;
      var salary = 0;
      if (salaryJson.from && salaryJson.to){
        salary =(salaryJson.from + salaryJson.to ) / 2;
      }
      else if(salaryJson.from)
        salary = salaryJson.from;
      else
        salary = salaryJson.to;
      data.push([textLength, salary]);
    }

    console.log(data);

    var result = regression('polynomial', data, 35);
    console.log(result);
    console.log(data.length);

    var sum = 0;
    for (var i = 0; i < data.length; i++) {
      sum += Math.abs(data[i][1] - result.points[i][1]);
    }
    console.log("Error = ", sum/data.length);
  });
}

var kmeans;
var clusters;

Ml.prototype.Clusterization = function() {
  Vacancy.find()
  .where("json.snippet.responsibility").ne(null)
  .where("json.snippet.requirement").ne(null)
  .limit(50).skip(0).then(function buildData(docs){
    console.log(docs.length);
    var data = [];
    for (var i = 0; i < docs.length; i++) {
      data.push([countWords(docs[i].json.name),
                 countWords(docs[i].json.snippet.responsibility),
                 countWords(docs[i].json.snippet.requirement)]);
    }

    kmeans = new clusterfck.Kmeans();
    clusters = kmeans.cluster(data, 3);
    console.log(clusters);

    prompt.start();
    input();
  });
}

function input(){
  prompt.get(['array value1', 'array value2', 'array value3'], function (err, result) {
    if (err) { return onErr(err); }
    var checkingArr = [result['array value1'], result['array value2'], result['array value3']];
    var clusterIndex = kmeans.classify(checkingArr);
    console.log("Classified cluster number is ", clusterIndex);
    input();
  });
}

function countWords(sentence) {
  var index = {},
      words = sentence
              .replace(/[.,?!;()"'-]/g, " ")
              .replace(/\s+/g, " ")
              .toLowerCase()
              .split(" ");

  return words.length;
}

Ml.prototype.Classification = function() {
  var data = [],
      input =[],
      output =[];
  var maxTfIdf = 8;
  Index.find().limit(TrainCount).skip(0).then(function buildData(docs){
    for (var i = 0; i < docs.length; i++) {
      for (var j = 0; j < docs[i].docIndex.length; j++) {
        var doc = docs[i].docIndex[j];
        input = {tf:doc.tf, idf: docs[i].idf / maxTfIdf};
        if (doc.place == "Title"){
          output = {Title: 1};
        }
        else if (doc.place == "Require"){
          output = {Require: 1};
        }
        else if (doc.place == "Response"){
          output = {Response: 1};
        }
        else{
          output = {};
        }

        data.push({input: input, output:output});
      }
    }

    console.log(net.train(data, {iterations: 20000}));

    var trueRes=0,
        allRes =0;
    Index.find().limit(10).skip(TrainCount).then(function buildData(docs){
      for (var i = 0; i < docs.length; i++) {
        for (var j = 0; j < docs[i].docIndex.length; j++) {
          var doc = docs[i].docIndex[j];
          input = {tf:doc.tf, idf: docs[i].idf/maxTfIdf};

          var res =net.run(input);

          console.log(res);
          allRes++;
          var maxInd = 0;
          console.log(docs[i].docIndex[j].place);
          if (res.Response > res.Title){
            if (res.Response > res.Require){
              if (docs[i].docIndex[j].place == "Response")
                trueRes++;
            }
            else{
              if (docs[i].docIndex[j].place == "Require")
                trueRes++;
            }
          }
          else{
            if (res.Title > res.Require){
              if (docs[i].docIndex[j].place == "Title")
                trueRes++;
            }
            else{
              if (docs[i].docIndex[j].place == "Require")
                trueRes++;
            }
          }
        }
      }
      console.log(trueRes + " / " + allRes);
    });
  });
}


module.exports = Ml;
