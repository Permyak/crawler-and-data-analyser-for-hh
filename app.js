'use strict';

var server = require('./server'),
    Crawler = require('./Crawler'),
    Indexer = require('./indexer'),
    Searcher = require('./searcher'),
    Ml = require('./ml');


//var crawler = new Crawler();
//crawler.Start();

//server.RunServer();

//var indexer = new Indexer();
//indexer.CreateIndex();
//indexer.FillIDF();
//indexer.PrintIndex();

//var searcher = new Searcher();
//searcher.querii('программист или инженер и технолог');

var ml =new Ml();
ml.Classification();
//ml.Association();
//ml.Regression();
//ml.Clusterization();
