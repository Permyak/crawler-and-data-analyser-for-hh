var nconf = require('nconf'),
    server = require('./server.js');

nconf.argv()
     .env()
     .file({ file: 'config.json' });

server.RunServer();
