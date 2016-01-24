'use strict';

var server = require('./server'),
    Crawler = require('./Crawler'),
    Indexer = require('./indexer');


//var crawler = new Crawler();
//crawler.Start();

server.RunServer();

var indexer = new Indexer();
//indexer.CreateIndex('myWord1', 144);
//console.log(indexer.CreateIndex('Ты удали это моё предложение! Срочно, прям очень. 1 23', 124));
//indexer.CreateIndex();
