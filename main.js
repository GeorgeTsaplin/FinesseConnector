// Modules to control application life and create native browser window
const { app } = require('electron');

const config = require('./config');

const trace = require('./trace');

const expressApp = require('./server');

const moment = require('moment');

const Protocol = 'tel';

const LongpollingTimeout = config.get('longpollingTimeout');
const UrlTtl = config.get('clickToCallCommandTtl');
const finesseApiUrlTtl = config.get('finesseApiCommandTtl');

let running = false;

// Deep linked url
let deeplinkingUrl;

app.on('before-quit', () => {
  trace.destroy();
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  if (!isSecondInstance) {
    start();
  }
  else {
    trace.log.debug(`onready: it is a second instance. Process id is ${process.pid}`);
  }
});

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (!running) {
    start();
  }
});

app.on('open-url', (event, url) => {
  event.preventDefault();
  processUrl(url);
});

var finesseCommands = [];
finesseCommands.add = function(route,method,commandBody){
  var command={
    "route":route,
    "method":method,
    "commandBody":commandBody,
    "timestamp": new Date()
  };
  this.push(command);
}

const isSecondInstance = app.makeSingleInstance((argv, workingDirectory) => {
  // HACK g.tsaplin: This callback executed at first\single instance of app
  trace.log.debug(`callback for makeSingleInstance. Process id is ${process.pid}`);
  // argv: An array of the second instance’s (command line / deep linked) arguments
  if (process.platform == 'win32') {
    // Keep only command line / deep linked arguments
    processUrl(argv.slice(1)[0]);
  }
})

if (isSecondInstance) {
  trace.log.debug(`it is a second instance. Process id is ${process.pid}`);

  app.quit();

  return;
}

trace.log.info('application started');

function waitForFinesseCommandAndReturnIt (request, response, longpollingTill) {
  var res = finesseCommands.shift();

  trace.log.debug(`waits for finesse api command till '${moment(longpollingTill).format('HH:mm:ss.SSS').toString()}' for request '${request.id}'...`);

  if (res) {
    var ttl = (new Date()) - res.timestamp;
    if (ttl < finesseApiUrlTtl) {

      try {
        trace.log.info(`returns finesse api request ${request.id} with body: ${JSON.stringify(res.commandBody)}`);      
      } catch(e) {
        trace.log.warn(`returns finesse api request ${request.id}, but cannot cast body to JSON: ${e.message}`);      
      }

      response.set('Content-Type', 'application/json')
        .status(200)
        .send(res);

      return;
    }
  }

  var dtNow = new Date();
  if (longpollingTill - dtNow <= 0) {
    response.status(204).end();
    return;
  }

  setTimeout(function() { waitForFinesseCommandAndReturnIt(request, response, longpollingTill) }, 300);
}

function waitForDeeplinkingUrlAndReturnIt (request, response, longpollingTill) {
  var res = deeplinkingUrl;
  deeplinkingUrl = null;

  trace.log.debug(`waits for deeplinking url till '${moment(longpollingTill).format('HH:mm:ss.SSS').toString()}' for request '${request.id}'...`);

  if (res) {
    var ttl = (new Date()) - res.timestamp;
    if (ttl < UrlTtl) {
      response.status(200).send(res.url);
      return;
    }
  }

  var dtNow = new Date();
  if (longpollingTill - dtNow <= 0) {
    response.status(204).send("");
    return;
  }

  setTimeout(function() { waitForDeeplinkingUrlAndReturnIt(request, response, longpollingTill) }, 300);
}

function start () {
  running = true;

  expressApp.startServer();

  { // routes for Express
    expressApp.get('/dequeue/clickToCall', (request, response) => {
      var longpollingTill = new Date((new Date()).getTime() + LongpollingTimeout);
      waitForDeeplinkingUrlAndReturnIt(request, response, longpollingTill);
    });
    
    expressApp.get('/dequeue/finesseApi', (request, response) => {
      var longpollingTill = new Date((new Date()).getTime() + LongpollingTimeout);
      waitForFinesseCommandAndReturnIt(request, response, longpollingTill);
    });
    
    expressApp.get('/finesseApi/*', (request, response) => {
      finesseCommands.add(request.url,'GET',request.body);
      response.status(200).end();
    });
    
    expressApp.post('/finesseApi/*', (request, response) => {
      finesseCommands.add(request.url,'POST',request.body);
      response.status(200).end();
    });
    
    expressApp.put('/finesseApi/*', (request, response) => {
      finesseCommands.add(request.url,'PUT',request.body);
      response.status(200).end();
    });
    
    expressApp.delete('/finesseApi/*', (request, response) => {
      finesseCommands.add(request.url,'DELETE',request.body);
      response.status(200).end();
    });  
  }

  if (process.platform == 'win32') {
    processUrl(process.argv.slice(1)[0]);
  }  
}

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
function processUrl (url) {
  if (!url) {
    return;
  }

  trace.log.info(`got deeplinking url: '${url}'`);

  deeplinkingUrl = { url: url, timestamp: new Date() };
}

app.setAsDefaultProtocolClient(Protocol);