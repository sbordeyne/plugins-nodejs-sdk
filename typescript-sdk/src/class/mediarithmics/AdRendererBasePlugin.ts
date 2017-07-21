import * as express from 'express';
import * as _ from 'lodash';
import * as cache from 'memory-cache';

import {
    AdRendererRequest
} from '../../interfaces/mediarithmics/api/AdRendererRequestInterface';
import {
    Creative,
    CreativeResponse
} from '../../interfaces/mediarithmics/api/CreativeInterface';
import {
    CreativeProperty,
    CreativePropertyResponse
} from '../../interfaces/mediarithmics/api/CreativePropertyInterface';
import {
    AdRendererBaseInstanceContext
} from "../../interfaces/mediarithmics/plugin/InstanceContextInterface";

import {
    BasePlugin
} from './BasePlugin';

export class AdRendererBasePlugin extends BasePlugin {

    instanceContext: Promise < AdRendererBaseInstanceContext >;

    // Helper to fetch the creative resource with caching
    fetchCreative(creativeId: string): Promise < Creative > {
        return super.requestGatewayHelper('GET', `${this.outboundPlatformUrl}/v1/creatives/${creativeId}`).then((result) => {
            this.logger.debug(`Fetched Creative: ${creativeId} - ${JSON.stringify(result.data)}`);
            return result.data;
        });
    }

    // Helper to fetch the creative resource with caching
    fetchCreativeProperties(creativeId: string): Promise < CreativeProperty[] > {
        return super.requestGatewayHelper('GET', `${this.outboundPlatformUrl}/v1/creatives/${creativeId}/renderer_properties`).then((result) => {
            this.logger.debug(`Fetched Creative Properties: ${creativeId} - ${JSON.stringify(result.data)}`);
            return result.data;
        });
    }

    getEncodedClickUrl(redirectUrls: string[]): string {
        let urls = redirectUrls.slice(0);
        return urls.reduceRight((acc, current) => current + encodeURIComponent(acc), '');
    }

    // How to bind the main function of the plugin
    setInstanceContextBuilder(instanceContextBuilder: (creativeId: string) => Promise < AdRendererBaseInstanceContext > ): void {
        this.buildInstanceContext = instanceContextBuilder;
    }

    // Method to build an instance context
    private buildInstanceContext: (creativeId: string) => Promise < AdRendererBaseInstanceContext > ;

    private onAdContents: (request: AdRendererRequest, instanceContext: AdRendererBaseInstanceContext) => string;

    private initAdContentsRoute(): void {

        this.app.post('/v1/ad_contents', (req: express.Request, res: express.Response) => {
            if (!req.body || _.isEmpty(req.body)) {
                const msg = {
                    error: "Missing request body"
                };
                this.logger.error('POST /v1/ad_contents : %s', msg);
                res.status(500).json(msg);
            } else {
                this.logger.debug(`POST /v1/ad_contents ${JSON.stringify(req.body)}`);

                const adRendererRequest = req.body as AdRendererRequest;

                if (!this.onAdContents) {
                    throw new Error('No AdContents listener registered!');
                }

                if (!cache.get(adRendererRequest.creative_id) || adRendererRequest.context == 'PREVIEW' || adRendererRequest.context == 'STAGE') {
                    cache.put(adRendererRequest.creative_id, this.buildInstanceContext(adRendererRequest.creative_id));
                }

                cache.get(adRendererRequest.creative_id).then((instanceContext: AdRendererBaseInstanceContext) => {
                    const adRendererResponse = this.onAdContents(adRendererRequest, instanceContext as AdRendererBaseInstanceContext);
                    res.status(200).send(adRendererResponse);
                }).catch((error: Error) => {
                    this.logger.error(`Something bad happened : ${error.message} - ${error.stack}`);
                    return res.status(500).send(error.message + "\n" + error.stack);
                });
            }
        });
    }

    constructor(adContentsHandler: (request: AdRendererRequest, instanceContext: AdRendererBaseInstanceContext) => string) {
        super();

        this.initAdContentsRoute();
        this.onAdContents = adContentsHandler;

        // Default Instance context builder
        this.setInstanceContextBuilder(async(creativeId: string) => {

            const creativeP = this.fetchCreative(creativeId);
            const creativePropsP = this.fetchCreativeProperties(creativeId);

            const results = await Promise.all([creativeP, creativePropsP])

            const creative = results[0];
            const creativeProps = results[1];

            const context = {
                creative: creative,
                creativeProperties: creativeProps
            } as AdRendererBaseInstanceContext;

            return context;
        });

    }

}