var config = require('nconf'),
    mongoose = require('./mongoose'),
    Vacancy = require('./vacancyModel'),
    Index = require('./indexModel'),
    moment = require('moment'),
    MyStem = require('mystem3/lib/MyStem');

var Indexer = function() {
    var indexer = this;
}

Indexer.prototype.Search = function(query) {
    var result;
    return Index.find({ word: query }).populate('docIndex.id');
}

Indexer.prototype.CreateIndex = function() {
    Vacancy.find().limit(10).exec().then(function CreateIndexForVacancies(vacancies){
       vacancies.forEach(function CreateIndexForVacancy(vac){
         console.log(vac.json.name);
         createIndexForSentence(vac.json.name, vac.id, 'Title')
       });
       console.log('end');
     });
}

var createIndexForSentence = function(sentence, documentID, documentPlace) {
    var clearedSentence = clearSentence(sentence);
    var words = removeStopWords(clearedSentence);

    lemmatizateAndSave(words, documentID, documentPlace);
}

var clearSentence = function(sentence){
    return sentence.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()0-9]/g, '').toLowerCase();
}

var removeStopWords = function(cleansed_string) {
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

    var words = cleansed_string.match(/[^\s]+|\s+[^\s+]$/g)

    for(var i=0; i < words.length; i++) {
        for(var j=0; j < stop_words.length; j++) {
            var word = words[i].replace(/\s+|[^a-zа-я]+/ig, "");   // Trim the word and remove non-alpha

            if (word == stop_words[j]) {
                words.splice(i, 1);

                //var regex_str = "^\\s*"+stop_word+"\\s*$";      // Only word
                //regex_str += "|^\\s*"+stop_word+"\\s+";     // First word
                //regex_str += "|\\s+"+stop_word+"\\s*$";     // Last word
                //regex_str += "|\\s+"+stop_word+"\\s+";      // Word somewhere in the middle
                //var regex = new RegExp(regex_str, "ig");
                //cleansed_string = cleansed_string.replace(regex, " ");
            }
        }
    }

    return words;
}

var lemmatizateAndSave = function(words, documentID, documentPlace){
    var myStem = new MyStem();
    process.setMaxListeners(1000);
    myStem.start();

    var promises = words.map(function(word) {
      return myStem.lemmatize(word);
    });

    Promise.all(promises).then(function(lemmas) {
      myStem.stop();
      saveIndex(lemmas, documentID, documentPlace);
    });
    return '';
}

var scopeFunc = function(word, documentID, documentPlace){
    var documentPosition=14;
    Index.find({ word: word }).then(function saveInDB(findedWords){
      if (!findedWords.length){
        var index = new Index({
          word: word,
          docIndex: [
            {
              id: documentID,
              place: documentPlace,
              position: documentPosition
            }
          ]
        });
        index.save(function (err, item) {
          if (err){
            console.log("Error", err);
          }
        });
      }
    });
}

var saveIndex = function(words, documentID, documentPlace){
    for (var word in words){
      scopeFunc(words[word], documentID, documentPlace)
    }
}

module.exports = Indexer;
