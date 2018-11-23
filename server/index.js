const express = require('express');
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const bodyParser = require("body-parser");
require('body-parser-xml')(bodyParser);

const config = require('../config');

const HttpPort = config.get('httpPort');
const HttpsPort = config.get('httpsPort');

const expressApp = express();

expressApp.use(bodyParser.urlencoded({ extended: false }));
expressApp.use(bodyParser.xml({
    limit: '1MB',   // Reject payload bigger than 1 MB
    xmlParseOptions: {
      normalize: true,     // Trim whitespace inside text nodes
      normalizeTags: false, 
      explicitArray: false // Only put nodes in array if >1
    }
  }));
//expressApp.use(bodyParser.json());

expressApp.use((req, res, next) => {
    res.set('Content-Type', 'text/plain');
    res.set('Access-Control-Allow-Origin', ['*']);
    res.set('Access-Control-Allow-Methods', ['GET','POST','PUT','DELETE']);
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    next();
})

if (HttpPort) {
    const httpServer = http.createServer(expressApp);
    httpServer.listen(HttpPort, () => console.log(`listening on port ${HttpPort}...`));
}

if (HttpsPort) {
    var privateKey  = fs.readFileSync(path.join(__dirname, '../cert/key.pem'));
    var certificate = fs.readFileSync(path.join(__dirname, '../cert/certificate.pem'));

    var options = {
        key: privateKey,
        cert: certificate
    };

    const httpsServer = https.createServer(options, expressApp);
    httpsServer.listen(HttpsPort, () => console.log(`listening on port ${HttpsPort}...`));
} 

module.exports = expressApp;