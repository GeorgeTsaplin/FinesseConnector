const nconf = require('nconf');
const path = require('path');

const configPath = path.join(__dirname, 'config.json');

console.info(`path to config is ${configPath}`);

nconf.file({file: configPath});

module.exports = nconf;