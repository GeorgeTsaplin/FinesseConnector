// Modules to control application life and create native browser window
const { app } = require('electron');

const config = require('./config');

const expressApp = require('./server');

/*// -----------------------------
// -- Configure app ------------
const config = require('nconf');
const path = require('path');

const configPath = path.join(__dirname, '..\\..\\config\\config.json');

console.info(`path to config is ${configPath}`);

config.file({file: configPath});
// -----------------------------
*/
const Protocol = 'tel';

const HttpPort = config.get('httpPort');
const HttpsPort = config.get('httpsPort');
const LongpollingTimeout = config.get('longpollingTimeout');
const UrlTtl = config.get('clickToCallCommandTtl');

let running = false;

// Deep linked url
let deeplinkingUrl;

const isSecondInstance = app.makeSingleInstance((argv, workingDirectory) => {
  // Protocol handler for win32
    // argv: An array of the second instance’s (command line / deep linked) arguments
    if (process.platform == 'win32') {
      // Keep only command line / deep linked arguments
      processUrl(argv.slice(1)[0]);
    }
})

if (isSecondInstance) {
  app.quit()
  return
}

expressApp.get('/clickToCall', (request, response) => {
  var longpollingTill = new Date((new Date()).getTime() + LongpollingTimeout);
  waitForDeeplinkingUrlAndReturnIt(request, response, longpollingTill);
});

/*
function createServer(app) {
  const expressApp = express();

  expressApp.use((req, res, next) => {
    res.set('Content-Type', 'text/plain');
    res.set('Access-Control-Allow-Origin', ['*']);
    res.set('Access-Control-Allow-Methods', 'GET');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    next();
  })

  expressApp.get('/clickToCall', (request, response) => {
    var longpollingTill = new Date((new Date()).getTime() + LongpollingTimeout);
    waitForDeeplinkingUrlAndReturnIt(request, response, longpollingTill);
  });

  if (HttpPort) {
    const httpServer = http.createServer(expressApp);
    httpServer.listen(HttpPort, () => console.log(`listening on port ${HttpPort}...`));
  }

  if (HttpsPort) {
    var privateKey  = fs.readFileSync('cert/key.pem');
    var certificate = fs.readFileSync('cert/certificate.pem');

    var options = {
      key: privateKey,
      cert: certificate
    };

    const httpsServer = https.createServer(options, expressApp);
    httpsServer.listen(HttpsPort, () => console.log(`listening on port ${HttpsPort}...`));
  }
}*/

function waitForDeeplinkingUrlAndReturnIt (request, response, longpollingTill) {
  var res = deeplinkingUrl;
  deeplinkingUrl = null;
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

  if (process.platform == 'win32') {
    processUrl(process.argv.slice(1)[0]);
  }  
}

//app.server = createServer(app);

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', start);

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (!running) {
    start();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
function processUrl (url) {
  if (!url) {
    return;
  }

  deeplinkingUrl = { url: url, timestamp: new Date() };
}

app.setAsDefaultProtocolClient(Protocol);

app.on('open-url', (event, url) => {
  event.preventDefault();
  processUrl(url);
});