var nconf = require('nconf'),
    server = require('./server.js'),
    Crawler = require("./Crawler");

nconf.argv()
     .env()
     .file({ file: 'config.json' });

var crawler = new Crawler();
crawler.Start();

server.RunServer();
