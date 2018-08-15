const express = require('express');
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const config = require('../config');

const HttpPort = config.get('httpPort');
const HttpsPort = config.get('httpsPort');

const expressApp = express();

expressApp.use((req, res, next) => {
    res.set('Content-Type', 'text/plain');
    res.set('Access-Control-Allow-Origin', ['*']);
    res.set('Access-Control-Allow-Methods', 'GET');
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