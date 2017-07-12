"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const rp = require("request-promise");
const winston = require("winston");
const bodyParser = require("body-parser");
class BasePlugin {
    constructor() {
        this.pluginPort = process.env.PLUGIN_PORT || 8080;
        // Log level update implementation
        // This method can be overriden by any subclass
        this.onLogLevelUpdate = function (req, res) {
            if (req.body && req.body.level) {
                this.logger.info('Setting log level to ' + req.body.level);
                this.logger.level = req.body.level;
                res.end();
            }
            else {
                this.logger.error('Incorrect body : Cannot change log level, actual: ' + this.logger.level);
                res.status(500).end();
            }
        };
        this.initLogLevelUpdateRoute = function () {
            //Route used by the plugin manager to check if the plugin is UP and running
            this.app.put('/v1/log_level', (req, res) => {
                this.onLogLevelUpdate(req, res);
            });
        };
        this.initLogLevelGetRoute = function () {
            this.app.get('/v1/log_level', function (req, res) {
                res.send({
                    level: this.logger.level
                });
            });
        };
        // Health Status implementation
        // This method can be overriden by any subclass
        this.onStatusRequest = function (req, res) {
            //Route used by the plugin manager to check if the plugin is UP and running
            this.logger.silly('GET /v1/status');
            if (this.worker_id && this.authentication_token) {
                res.end();
            }
            else {
                res.status(503).end();
            }
        };
        this.initStatusRoute = function () {
            this.app.get('/v1/status', (req, res) => {
                this.onStatusRequest(req, res);
            });
        };
        // Plugin Init implementation
        // This method can be overriden by any subclass
        this.onInitRequest = function (req, res) {
            this.logger.debug('POST /v1/init ', req.body);
            this.authentication_token = req.body.authentication_token;
            this.worker_id = req.body.worker_id;
            this.logger.info('Update authentication_token with %s', this.authentication_token);
            res.end();
        };
        this.initInitRoute = function () {
            this.app.post('/v1/init', (req, res) => {
                this.onInitRequest(req, res);
            });
        };
        // Helper request function
        this.request = function (method, uri, body) {
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
                }
                else {
                    throw e;
                }
            });
        };
        this.app = express();
        this.app.use(bodyParser.json({
            type: '*/*'
        }));
        this.logger = new (winston.Logger)({
            transports: [
                new (winston.transports.Console)(),
            ]
        });
        this.initInitRoute();
        this.initStatusRoute();
        this.initLogLevelUpdateRoute();
        this.initLogLevelGetRoute();
        this.app.listen(this.pluginPort, () => this.logger.info('Renderer started, listening at ' + this.pluginPort));
    }
}
exports.BasePlugin = BasePlugin;
