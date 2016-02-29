'use strict';

var server = require('./server'),
    Crawler = require('./Crawler'),
    Indexer = require('./indexer');


//var crawler = new Crawler();
//crawler.Start();

//server.RunServer();

var indexer = new Indexer();
indexer.CreateIndex();
//indexer.fillIDF();
//indexer.PrintIndex();
//indexer.CreateMetaIndex();
