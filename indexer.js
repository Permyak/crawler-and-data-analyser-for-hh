var config = require('nconf'),
    mongoose = require('./mongoose'),
    Vacancy = require('./vacancyModel'),
    Index = require('./indexModel'),
    moment = require('moment'),
    MyStem = require('mystem3/lib/MyStem'),
    locks = require('locks'),
    fs = require('fs'),
    mystem = require('mystem/lib/index');

var Indexer = function() {
    var indexer = this;
}

var mutex = locks.createMutex();
var wordsForSaveCount = 0,
    savedWordsCount = 0;
var initialSemValue = 100;
var sem = locks.createSemaphore(initialSemValue);

var myStem = new MyStem();
process.setMaxListeners(1000);
myStem.start();

Indexer.prototype.PrintIndex = function(query) {
  Index.find().exec().then(function PrintInd(indexes){
    var wstream = fs.createWriteStream('myOutput.txt');
    for (var i = 0; i < indexes.length; i++) {
      for(var j=0; j< indexes[i].docIndex.length; j++){
          wstream.write(indexes[i].word +' '+ indexes[i].idf +' '+
          indexes[i].docIndex[j].tf +' '+ indexes[i].docIndex[j].tfidf + '\n');
      }
    }
    wstream.end();
    return;
  });
}

Indexer.prototype.CreateIndex = function() {
    Vacancy.find().exec().then(function CreateIndexForVacancies(vacancies){
      console.log('finded ', vacancies.length);
      var i=0;
       vacancies.forEach(function CreateIndexForVacancy(vac){
         sem.wait(function () {
           console.log(++i + ') ' + vac.json.name);
           createIndexForSentence(vac.json.name, vac, 'Title')
           if (vac.json.snippet.responsibility) {
             createIndexForSentence(vac.json.snippet.responsibility, vac, 'Response');
           }
           if (vac.json.snippet.requirement){
             createIndexForSentence(vac.json.snippet.requirement, vac, 'Require');
           }
         });
       });
       console.log('end');
     });
}

var calculateIDF = function(index, vacanciesCount){
  index.idf = Math.log(vacanciesCount / index.docIndex.length);

  for (var i = 0; i < index.docIndex.length; i++) {
    index.docIndex[i].tfidf = index.idf * index.docIndex[i].tf;
  }

  index.save(function (err, item) {
    if (err){
      console.log("Error", err);
    }
  });
}

Indexer.prototype.FillIDF = function() {
    Vacancy.count({}, function(err, vacanciesCount){
      Index.find().exec().then(function fillIDFs(indeces){
        indeces.forEach(function fillIDFindex(index){
          calculateIDF(index, vacanciesCount);
        });
        console.log('end');
      });
    });
}

var createIndexForSentence = function(sentence, document, documentPlace) {
    var clearedSentence = clearSentence(sentence);
    var words = removeStopWords(clearedSentence);

    var saveFunc = function(err, data){
    	saveIndex(data, document, documentPlace);
    };

    lemmatizate(words, saveFunc);
}

Indexer.prototype.ClearSentence = function(sentence){
    return sentence.replace(/[.,\/#!%\^&\*;:{}=\-_`~()0-9]/g, ' ').toLowerCase();
}

Indexer.prototype.RemoveStopWords = function(cleansed_string, isBoolOpDeleting) {
    var cleanWords = cleansed_string.match(/[^\s]+|\s+[^\s+]$/g);
    if (cleanWords){
      var removedCount = 0;
      var resultWords = cleanWords.slice();
      var stopwords = [];
      if (isBoolOpDeleting){
        stopwords = stop_words;
      }
      else{
        stopwords = stop_wordsWithoutBoolOp;
      }
      for(var i=0; i < cleanWords.length; i++) {
          for(var j=0; j < stopwords.length; j++) {
              var word = cleanWords[i].replace(/\s+|[^a-zа-я]+/ig, "");
              if (word == stopwords[j]) {
                resultWords.splice(i-removedCount++, 1);
              }
          }
      }
    }

    return resultWords;
}

Indexer.prototype.Lemmatizate = function(words, cb){
    mystem(words, cb);
}

var saveIndexScopeFunc = function(word, document, documentPlace, TF, resolve){
    mutex.lock(function () {
      Index.find({ word: word }).then(function saveInDB(findedWords){
        if (!findedWords.length){
          //create
          var index = new Index({
            word: word,
            idf: 0,
            docIndex: [
              {
                id: document.id,
                place: documentPlace,
                tf: TF,
                tfidf: 0
              }
            ]
          });
          return index.save(function (err, item) {
            if (err){
              console.log("Error", err);
            }
          }).then(function (doc) {
            mutex.unlock();
            console.log(++savedWordsCount + "/" + wordsForSaveCount);
            resolve();
          });
        }
        else{
          //add
          findedWords[0].docIndex.push({
            id: document.id,
            place: documentPlace,
            tf: TF,
            tfidf: 0
          });

          return findedWords[0].save(function (err, item) {
            if (err){
              console.log("Error", err);
            }
          }).then(function (doc) {
            mutex.unlock();
            console.log(++savedWordsCount + "/" + wordsForSaveCount);
            resolve();
          });
        }
      });
    });
}

var getWordCount = function(word, words){
    var count=0;
    for(i = 0; i < words.length; i++){
        if (words[i] === word)
            count++;
    }
    return count;
}

var getTF = function(word, words){
    return getWordCount(word, words) / words.length;
}

var saveIndex = function(words, document, documentPlace){
  wordsForSaveCount += words.length;

  var promises = words.map(function(word) {
    return new Promise(function(resolve, reject) {
      saveIndexScopeFunc(word.toString(), document, documentPlace, getTF(word, words), resolve);
    });
  });
  Promise.all(promises).then(function(lemmas) {
    sem.signal();
  });
}

var stop_wordsWithoutBoolOp = new Array(
  'а',
  'без',
  'более',
  'больше',
  'будет',
  'будто',
  'бы',
  'был',
  'была',
  'были',
  'было',
  'быть',
  'в',
  'вам',
  'вас',
  'вдруг',
  'ведь',
  'во',
  'вот',
  'впрочем',
  'все',
  'всегда',
  'всего',
  'всех',
  'всю',
  'вы',
  'г',
  'где',
  'говорил',
  'да',
  'даже',
  'два',
  'для',
  'до',
  'другой',
  'его',
  'ее',
  'ей',
  'ему',
  'если',
  'есть',
  'еще',
  'ж',
  'же',
  'жизнь',
  'за',
  'зачем',
  'здесь',
  'из',
  'из-за',
  'им',
  'иногда',
  'их',
  'к',
  'кажется',
  'как',
  'какая',
  'какой',
  'когда',
  'конечно',
  'которого',
  'которые',
  'кто',
  'куда',
  'ли',
  'лучше',
  'между',
  'меня',
  'мне',
  'много',
  'может',
  'можно',
  'мой',
  'моя',
  'мы',
  'на',
  'над',
  'надо',
  'наконец',
  'нас',
  'него',
  'нее',
  'ней',
  'нельзя',
  'нет',
  'ни',
  'нибудь',
  'никогда',
  'ним',
  'них',
  'ничего',
  'но',
  'ну',
  'о',
  'об',
  'один',
  'он',
  'она',
  'они',
  'опять',
  'от',
  'перед',
  'по',
  'под',
  'после',
  'потом',
  'потому',
  'почти',
  'при',
  'про',
  'раз',
  'разве',
  'с',
  'сам',
  'свое',
  'свою',
  'себе',
  'себя',
  'сегодня',
  'сейчас',
  'сказал',
  'сказала',
  'сказать',
  'со',
  'совсем',
  'так',
  'такой',
  'там',
  'тебя',
  'тем',
  'теперь',
  'то',
  'тогда',
  'того',
  'тоже',
  'только',
  'том',
  'тот',
  'три',
  'тут',
  'ты',
  'у',
  'уж',
  'уже',
  'хорошо',
  'хоть',
  'чего',
  'человек',
  'чем',
  'через',
  'что',
  'чтоб',
  'чтобы',
  'чуть',
  'эти',
  'этого',
  'этой',
  'этом',
  'этот',
  'эту',
  'я'
)

var stop_words = new Array(
  'а',
  'без',
  'более',
  'больше',
  'будет',
  'будто',
  'бы',
  'был',
  'была',
  'были',
  'было',
  'быть',
  'в',
  'вам',
  'вас',
  'вдруг',
  'ведь',
  'во',
  'вот',
  'впрочем',
  'все',
  'всегда',
  'всего',
  'всех',
  'всю',
  'вы',
  'г',
  'где',
  'говорил',
  'да',
  'даже',
  'два',
  'для',
  'до',
  'другой',
  'его',
  'ее',
  'ей',
  'ему',
  'если',
  'есть',
  'еще',
  'ж',
  'же',
  'жизнь',
  'за',
  'зачем',
  'здесь',
  'и',
  'из',
  'из-за',
  'или',
  'им',
  'иногда',
  'их',
  'к',
  'кажется',
  'как',
  'какая',
  'какой',
  'когда',
  'конечно',
  'которого',
  'которые',
  'кто',
  'куда',
  'ли',
  'лучше',
  'между',
  'меня',
  'мне',
  'много',
  'может',
  'можно',
  'мой',
  'моя',
  'мы',
  'на',
  'над',
  'надо',
  'наконец',
  'нас',
  'не',
  'него',
  'нее',
  'ней',
  'нельзя',
  'нет',
  'ни',
  'нибудь',
  'никогда',
  'ним',
  'них',
  'ничего',
  'но',
  'ну',
  'о',
  'об',
  'один',
  'он',
  'она',
  'они',
  'опять',
  'от',
  'перед',
  'по',
  'под',
  'после',
  'потом',
  'потому',
  'почти',
  'при',
  'про',
  'раз',
  'разве',
  'с',
  'сам',
  'свое',
  'свою',
  'себе',
  'себя',
  'сегодня',
  'сейчас',
  'сказал',
  'сказала',
  'сказать',
  'со',
  'совсем',
  'так',
  'такой',
  'там',
  'тебя',
  'тем',
  'теперь',
  'то',
  'тогда',
  'того',
  'тоже',
  'только',
  'том',
  'тот',
  'три',
  'тут',
  'ты',
  'у',
  'уж',
  'уже',
  'хорошо',
  'хоть',
  'чего',
  'человек',
  'чем',
  'через',
  'что',
  'чтоб',
  'чтобы',
  'чуть',
  'эти',
  'этого',
  'этой',
  'этом',
  'этот',
  'эту',
  'я'
)

module.exports = Indexer;
