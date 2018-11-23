const rfs = require('rotating-file-stream');
const log = require('electron-log');
const morgan = require('morgan')

const path = require('path');

const config = require('../config');

function configureTraceStream() {
    const FileName = config.get('logging:fileName') || './logs/finesseConnector.log';
    const fileNameParts = FileName.split('/');
    const RfsFileName = fileNameParts[fileNameParts.length - 1];

    var rfsPath;
    // if relative path
    if (fileNameParts[0] == '.') {
        rfsPath = path.join(__dirname, "../../" + fileNameParts.slice(1, fileNameParts.length - 1).join('/'));
    }
    else {
        rfsPath = path.dirname(FileName);
    }

    return rfs(
        RfsFileName,
        {
            path: rfsPath,
            interval: config.get('logging:interval') || '1d',
            size: config.get('logging:size') || '30M',
            maxSize: config.get('logging:maxSize') || '300M'
        });
}

function configureLogger(stream) {
    log.transports.console.level = false;

    log.transports.file.level = config.get('logging:logLevel') || 'warn';

    log.transports.file.format = '{h}:{i}:{s}:{ms} {level} {text}';
    log.transports.file.stream = stream;

    return log;
}

function configureMorgan(stream) {
    morgan.token('id', (req) => { return req.id; });

    morgan.token('origin', (req) => { return req.headers['origin']; });


    return morgan(
        config.get('logging:morganFormat'),
        {
            stream: stream
        });
}

const TraceRfs = configureTraceStream();

module.exports = {
    log: configureLogger(TraceRfs),
    morgan: configureMorgan(TraceRfs)
};