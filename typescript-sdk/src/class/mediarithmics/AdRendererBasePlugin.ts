import * as express from 'express';
import * as _ from 'lodash';
import * as Promise from 'bluebird';

import * as AdRendererRequest from '../../interfaces/mediarithmics/AdRendererRequestInterface';
import * as Creative from '../../interfaces/mediarithmics/CreativeInterface';
import * as CreativeProperty from '../../interfaces/mediarithmics/CreativePropertyInterface';

import {
    BasePlugin
} from './BasePlugin';

export class AdRendererBasePlugin extends BasePlugin {

    creativeCache: Map < string, Promise < Creative.CreativeResponse >> = new Map();
    creativePropertiesCache: Map < string, Promise < CreativeProperty.CreativePropertyResponse >> = new Map();

    // Helper to fetch the creative resource with caching
    fetchCreative (creativeId: string): Promise < Creative.Creative > {
        if (!this.creativeCache.get(creativeId)) {
            this.creativeCache.set(creativeId, super.requestGatewayHelper('GET', `${this.outboundPlatformUrl}/v1/creatives/${creativeId}`));
        }
        return this.creativeCache.get(creativeId).then((result) => { 
            this.logger.debug(`Fetched Creative: ${creativeId} - ${JSON.stringify(result.data)}`);
            return result.data; });
    }

    // Helper to fetch the creative resource with caching
    fetchCreativeProperties (creativeId: string): Promise < CreativeProperty.CreativeProperty[] > {
        if(!this.creativePropertiesCache.get(creativeId)) {
            this.creativePropertiesCache.set(creativeId, super.requestGatewayHelper('GET', `${this.outboundPlatformUrl}/v1/creatives/${creativeId}/renderer_properties`));
        }
        return this.creativePropertiesCache.get(creativeId).then((result) => { 
                        this.logger.debug(`Fetched Creative Properties: ${creativeId} - ${JSON.stringify(result.data)}`);
            return result.data; });
    }

    getEncodedClickUrl (redirectUrls: string[]): string {
        let urls = redirectUrls.slice(0);
        return urls.reduceRight((acc, current) => current + encodeURIComponent(acc), '');
    }

    // How to bind the main function of the plugin
    addOnAdContentsListener (listener: (request: AdRendererRequest.AdRendererRequest, response: express.Response) => void): void {
        this.onAdContents = listener;
    }

    // Main plugin method
    private onAdContents: (request: AdRendererRequest.AdRendererRequest, response: express.Response) => void;

    private initAdContentsRoute (): void {

        this.app.post('/v1/ad_contents', (req: express.Request, res: express.Response) => {
            if (!req.body || _.isEmpty(req.body)) {
                const msg = {
                    error: "Missing request body"
                };
                this.logger.error('POST /v1/ad_contents : %s', msg);
                res.status(500).json(msg);
            } else {
                this.logger.debug(`POST /v1/ad_contents ${JSON.stringify(req.body)}`);

                this.onAdContents(req.body as AdRendererRequest.AdRendererRequest, res);
            }
        });
    }

    constructor() {
        super();

        this.initAdContentsRoute();

            // Caches expiration
            setInterval(() => {
            this.logger.silly("Invalidating cache");

            this.creativeCache = new Map();
            this.creativePropertiesCache = new Map();

            }, 30000);

    }

}