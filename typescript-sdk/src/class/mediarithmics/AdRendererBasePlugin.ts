import * as express from 'express';
import * as _ from 'lodash';

import {
    BasePlugin
} from './BasePlugin';

export class AdRendererBasePlugin extends BasePlugin {

    fetchCreative = function () {}

    initAdContentsRoute = function () {

        this.app.post('/v1/ad_contents', (req: express.Request, res: express.Response) => {
            if (!req.body || _.isEmpty(req.body)) {
                const msg = {
                    error: "Missing request body"
                };
                this.logger.error('POST /v1/ad_contents : %s', msg);
                res.status(500).json(msg);
            } else {
                this.logger.info(`POST /v1/ad_contents ${req.body}`);
                res.send('Yolo');
            }

        });
    }

    constructor() {
        super();

        this.initAdContentsRoute();

    }

}