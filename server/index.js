const express = require('express');
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const uuid = require('node-uuid');

const config = require('../config');

const trace = require('../trace');

const HttpPort = config.get('httpPort');
const HttpsPort = config.get('httpsPort');

const expressApp = express();

expressApp.use((req, res, next) => {
    req.id = uuid.v4();
    next();
});

// add logging
expressApp.use(trace.morgan);

expressApp.use((req, res, next) => {
    res.set('Content-Type', 'text/plain');
    res.set('Access-Control-Allow-Origin', ['*']);
    res.set('Access-Control-Allow-Methods', 'GET');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    next();
})

if (HttpPort) {
    const httpServer = http.createServer(expressApp);
    httpServer.listen(HttpPort, () => trace.log.info(`listening on HTTP port ${HttpPort}...`));
}

if (HttpsPort) {
    var privateKey  = fs.readFileSync(path.join(__dirname, '../cert/key.pem'));
    var certificate = fs.readFileSync(path.join(__dirname, '../cert/certificate.pem'));

    var options = {
        key: privateKey,
        cert: certificate
    };

    const httpsServer = https.createServer(options, expressApp);
    httpsServer.listen(HttpsPort, () => trace.log.info(`listening on HTTPS port ${HttpsPort}...`));
} 

module.exports = expressApp;