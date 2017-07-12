import * as express from 'express';
import * as rp from 'request-promise';
import * as winston from 'winston';
import * as bodyParser from 'body-parser';
import * as Promise from 'Bluebird';

export class BasePlugin {

    pluginPort: number = process.env.PLUGIN_PORT || 8080;

    app: express.Application;
    logger: winston.LoggerInstance;
    worker_id: string;
    authentication_token: string;

    // Log level update implementation
    // This method can be overriden by any subclass
    onLogLevelUpdate = function (req: express.Request, res: express.Response) {
        if (req.body && req.body.level) {
            this.logger.info('Setting log level to ' + req.body.level);
            this.logger.level = req.body.level;
            res.end();
        } else {
            this.logger.error('Incorrect body : Cannot change log level, actual: ' + this.logger.level);
            res.status(500).end();
        }
    }

    private initLogLevelUpdateRoute = function () {
        //Route used by the plugin manager to check if the plugin is UP and running
        this.app.put('/v1/log_level', (req: express.Request, res: express.Response) => {
            this.onLogLevelUpdate(req, res);
        });
    }

    private initLogLevelGetRoute = function () {
        this.app.get('/v1/log_level', function (req: express.Request, res: express.Response) {
            res.send({
                level: this.logger.level
            });
        });
    }

    // Health Status implementation
    // This method can be overriden by any subclass

    onStatusRequest = function (req: express.Request, res: express.Response) {
        //Route used by the plugin manager to check if the plugin is UP and running
        this.logger.silly('GET /v1/status');
        if (this.worker_id && this.authentication_token) {
            res.end();
        } else {
            res.status(503).end();
        }
    }

    private initStatusRoute = function () {
        this.app.get('/v1/status', (req: express.Request, res: express.Response) => {
            this.onStatusRequest(req, res);
        });
    }

    // Plugin Init implementation
    // This method can be overriden by any subclass

    onInitRequest = function (req: express.Request, res: express.Response) {
        this.logger.debug('POST /v1/init ', req.body);
        this.authentication_token = req.body.authentication_token;
        this.worker_id = req.body.worker_id;
        this.logger.info('Update authentication_token with %s', this.authentication_token);
        res.end();
    }

    initInitRoute = function () {
        this.app.post('/v1/init', (req: express.Request, res: express.Response) => {
            this.onInitRequest(req, res);
        });
    }

    // Helper request function
    request = function (method: string, uri: string, body ? : string) {

        const options = {
            method: method,
            uri: uri,
            json: true,
            auth: {
                user: this.worker_id,
                pass: this.authentication_token,
                sendImmediately: true
            }
        };

        return rp(body ? Object.assign({
            body: body
        }, options) : options).catch(function (e) {
            if (e.name === "StatusCodeError") {
                throw new Error(`Error while calling ${method} '${uri}' with the request body '${body || ""}': got a ${e.response.statusCode} ${e.response.statusMessage} with the response body ${JSON.stringify(e.response.body)}`);
            } else {
                throw e;
            }
        });
    }

    constructor() {
        this.app = express();
        this.app.use(bodyParser.json({
            type: '*/*'
        }));
        this.logger = new(winston.Logger)({
            transports: [
                new(winston.transports.Console)(),
            ]
        });

        this.initInitRoute();
        this.initStatusRoute();
        this.initLogLevelUpdateRoute();
        this.initLogLevelGetRoute();

        this.app.listen(this.pluginPort, () => this.logger.info('Renderer started, listening at ' + this.pluginPort));

    }

}