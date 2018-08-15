# Finesse Connector

Finesse Connector is necessary tightly integration of Сontact Сenter operator`s workstation and Finesse web-application.

Application features are:

1. Make call via Finesse by clicking on URL with tel:// protocol (Click-To-Call);
2. ...

## Pre-Build steps

1. npm install
2. yarn install

Historically project used `npm`, but electron-builder required yarn, so now on project uses both package managers.

## Packaging and distribution

To make distributable package for Windows run `yarn dist`. This command creates NSIS installer with [ClickOnce feature](https://en.wikipedia.org/wiki/ClickOnce).

Application can be packaged to run at Linux and MacOS by [electron-builder](https://www.electron.build/), but it's requires some additional step with help of electron-builder [documentation](https://www.electron.build/multi-platform-build).

## Application architecture and configuration

After installation application folder must have such structure:

* FinesseConnector
    * resources
        * app.asar.unpacked
            * cert
                * certificate.pem - certificate for server validation
                * key.pem - certificate private key
            * config
                * [config.json](.\config\config.json)

Configuration parameters are:

1. `httpPort` - HTTP port to listen requests on;
2. `httpsPort` - HTTPS port to listen requests on;
3. `longpollingTimeout` - after getting request application will waits for data to send as response for specified milliseconds (for example waits command to perform Click-To-Call);
4. `clickToCallCommandTtl` - after operator click `tel://` URL appropriate command will waits incoming HTTP request for specified time in milliseconds. If come no request then command will be forgotten.

After start application runs Web Server and listen requests on specified at configuration file HTTP and HTTPS ports (must be specified **at least** one of them).
Recommended to use HTTPS port because of security consideration and better browsers support.

---
**Note**

HTTP will not work at Internet Explorer if Finesse works under HTTPS.

---

For working under HTTPS you must:

1. Create HostA record for 127.0.0.1 at DNS. For example it may be record with name "local";
2. Create certificate for server validation with "Issued To" equals to FQDN of HostA from step 1;

    Certificate can be created by technical department of your organization.

    As an alternative you can create self-signed certificate using OpenSSL CLI:
    `openssl req -x509 -newkey rsa:2048 -keyout key.pem -out certificate.pem -days XXX`

3. Copy generated certificate and it's private key to application's folder ".\resources\app.asar.unpacked\cert".

### Register Application as URL Deep Linking handler

At Windows 7 required no additional steps to register Finesse Connector as tel:// protocol handler.

At Windows 10 you must add some records to registry. As an example you should use this [.reg file](.\registerTelSchemaAtWin10.reg)
(you must write correct path to application at keys "\DefaultIcon" and "\shell\open\command").

Additional info can be found [here](https://electronjs.org/docs/api/app#appsetasdefaultprotocolclientprotocol-path-args).

## License

[GNU GENERAL PUBLIC LICENSE](LICENSE)
