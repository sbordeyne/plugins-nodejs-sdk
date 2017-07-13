import * as express from 'express';
import * as _ from 'lodash';
import * as Promise from 'Bluebird';

import * as AdRendererRequest from '../../interfaces/mediarithmics/AdRendererRequestInterface';
import * as Creative from '../../interfaces/mediarithmics/CreativeInterface';
import * as CreativeProperty from '../../interfaces/mediarithmics/CreativePropertyInterface';

import {
    BasePlugin
} from './BasePlugin';

export class AdRendererBasePlugin extends BasePlugin {

    fetchCreative = function (creativeId: string): Promise < Creative.CreativeResponse > {
        return this.super.requestGatewayHelper('GET', `${this.outboundPlatformUrl}/v1/creatives/${creativeId}`);
    }

    fetchCreativeProperties = function (creativeId: string): Promise < CreativeProperty.CreativePropertyResponse > {
        return this.super.requestGatewayHelper('GET', `${this.outboundPlatformUrl}/v1/creatives/${creativeId}/renderer_properties`);
    }

    onAdContents = function (request: AdRendererRequest.AdRendererRequest) {

    }

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

                this.onAdContents();

            }

        });
    }

    constructor() {
        super();

        this.initAdContentsRoute();

    }

}