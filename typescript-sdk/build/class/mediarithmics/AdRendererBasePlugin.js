"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const BasePlugin_1 = require("./BasePlugin");
class AdRendererBasePlugin extends BasePlugin_1.BasePlugin {
    constructor() {
        super();
        this.creativeCache = new Map();
        this.creativePropertiesCache = new Map();
        this.initAdContentsRoute();
        // Caches expiration
        setInterval(() => {
            this.logger.silly("Invalidating cache");
            this.creativeCache = new Map();
            this.creativePropertiesCache = new Map();
        }, 30000);
    }
    // Helper to fetch the creative resource with caching
    fetchCreative(creativeId) {
        if (!this.creativeCache.get(creativeId)) {
            this.creativeCache.set(creativeId, super.requestGatewayHelper('GET', `${this.outboundPlatformUrl}/v1/creatives/${creativeId}`));
        }
        return this.creativeCache.get(creativeId).then((result) => {
            this.logger.debug(`Fetched Creative: ${creativeId} - ${JSON.stringify(result.data)}`);
            return result.data;
        });
    }
    // Helper to fetch the creative resource with caching
    fetchCreativeProperties(creativeId) {
        if (!this.creativePropertiesCache.get(creativeId)) {
            this.creativePropertiesCache.set(creativeId, super.requestGatewayHelper('GET', `${this.outboundPlatformUrl}/v1/creatives/${creativeId}/renderer_properties`));
        }
        return this.creativePropertiesCache.get(creativeId).then((result) => {
            this.logger.debug(`Fetched Creative Properties: ${creativeId} - ${JSON.stringify(result.data)}`);
            return result.data;
        });
    }
    getEncodedClickUrl(redirectUrls) {
        let urls = redirectUrls.slice(0);
        return urls.reduceRight((acc, current) => current + encodeURIComponent(acc), '');
    }
    // How to bind the main function of the plugin
    addOnAdContentsListener(listener) {
        this.onAdContents = listener;
    }
    initAdContentsRoute() {
        this.app.post('/v1/ad_contents', (req, res) => {
            if (!req.body || _.isEmpty(req.body)) {
                const msg = {
                    error: "Missing request body"
                };
                this.logger.error('POST /v1/ad_contents : %s', msg);
                res.status(500).json(msg);
            }
            else {
                this.logger.debug(`POST /v1/ad_contents ${JSON.stringify(req.body)}`);
                this.onAdContents(req.body, res);
            }
        });
    }
}
exports.AdRendererBasePlugin = AdRendererBasePlugin;
