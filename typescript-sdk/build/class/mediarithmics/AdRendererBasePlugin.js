"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const BasePlugin_1 = require("./BasePlugin");
class AdRendererBasePlugin extends BasePlugin_1.BasePlugin {
    constructor() {
        super();
        this.fetchCreative = function () { };
        this.initAdContentsRoute = function () {
            this.app.post('/v1/ad_contents', (req, res) => {
                if (!req.body || _.isEmpty(req.body)) {
                    const msg = {
                        error: "Missing request body"
                    };
                    this.logger.error('POST /v1/ad_contents : %s', msg);
                    res.status(500).json(msg);
                }
                else {
                    this.logger.info(`POST /v1/ad_contents ${req.body}`);
                    res.send('Yolo');
                }
            });
        };
        this.initAdContentsRoute();
    }
}
exports.AdRendererBasePlugin = AdRendererBasePlugin;
