var locks = require('locks');

var Indexer = function() {
    var indexer = this;
}

Indexer.prototype.Search = function(query) {
    return getLemmatizateWordsPromise(removeStopWords(clearSentence(query)));
}


module.exports = locks;
