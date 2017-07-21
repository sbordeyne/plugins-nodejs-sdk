"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const cache = require("memory-cache");
const BasePlugin_1 = require("./BasePlugin");
class AdRendererBasePlugin extends BasePlugin_1.BasePlugin {
    // Helper to fetch the creative resource with caching
    fetchCreative(creativeId) {
        return super.requestGatewayHelper('GET', `${this.outboundPlatformUrl}/v1/creatives/${creativeId}`).then((result) => {
            this.logger.debug(`Fetched Creative: ${creativeId} - ${JSON.stringify(result.data)}`);
            return result.data;
        });
    }
    // Helper to fetch the creative resource with caching
    fetchCreativeProperties(creativeId) {
        return super.requestGatewayHelper('GET', `${this.outboundPlatformUrl}/v1/creatives/${creativeId}/renderer_properties`).then((result) => {
            this.logger.debug(`Fetched Creative Properties: ${creativeId} - ${JSON.stringify(result.data)}`);
            return result.data;
        });
    }
    getEncodedClickUrl(redirectUrls) {
        let urls = redirectUrls.slice(0);
        return urls.reduceRight((acc, current) => current + encodeURIComponent(acc), '');
    }
    // How to bind the main function of the plugin
    setInstanceContextBuilder(instanceContextBuilder) {
        this.buildInstanceContext = instanceContextBuilder;
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
                const adRendererRequest = req.body;
                if (!this.onAdContents) {
                    throw new Error('No AdContents listener registered!');
                }
                if (!cache.get(adRendererRequest.creative_id) || adRendererRequest.context == 'PREVIEW' || adRendererRequest.context == 'STAGE') {
                    cache.put(adRendererRequest.creative_id, this.buildInstanceContext(adRendererRequest.creative_id));
                }
                cache.get(adRendererRequest.creative_id).then((instanceContext) => {
                    const adRendererResponse = this.onAdContents(adRendererRequest, instanceContext);
                    res.status(200).send(adRendererResponse);
                }).catch((error) => {
                    this.logger.error(`Something bad happened : ${error.message} - ${error.stack}`);
                    return res.status(500).send(error.message + "\n" + error.stack);
                });
            }
        });
    }
    constructor(adContentsHandler) {
        super();
        this.initAdContentsRoute();
        this.onAdContents = adContentsHandler;
        // Default Instance context builder
        this.setInstanceContextBuilder((creativeId) => __awaiter(this, void 0, void 0, function* () {
            const creativeP = this.fetchCreative(creativeId);
            const creativePropsP = this.fetchCreativeProperties(creativeId);
            const results = yield Promise.all([creativeP, creativePropsP]);
            const creative = results[0];
            const creativeProps = results[1];
            const context = {
                creative: creative,
                creativeProperties: creativeProps
            };
            return context;
        }));
    }
}
exports.AdRendererBasePlugin = AdRendererBasePlugin;
