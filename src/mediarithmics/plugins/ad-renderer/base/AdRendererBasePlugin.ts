import * as express from "express";
import * as _ from "lodash";
import * as jsesc from "jsesc";

import {
  PropertiesWrapper,
  BasePlugin
} from '../../common/BasePlugin';
import {DisplayAd} from '../../../api/core/creative/index';
import {PluginProperty} from '../../../api/core/plugin/PluginPropertyInterface';
import {
  AdRendererPluginResponse,
  AdRendererRequest 
} from './AdRendererInterface'
import {Option} from '../../../utils/index';

export class AdRendererBaseInstanceContext {
  properties: PropertiesWrapper;
  displayAd: DisplayAd;    
}

export abstract class AdRendererBasePlugin<
  T extends AdRendererBaseInstanceContext
> extends BasePlugin {
  instanceContext: Promise<T>;

  displayContextHeader = "x-mics-display-context";

  // Helper to fetch the Display Ad resource with caching
  async fetchDisplayAd(displayAdId: string, forceReload = false): Promise<DisplayAd> {
    const response = await super.requestGatewayHelper(
      "GET",
      `${this.outboundPlatformUrl}/v1/creatives/${displayAdId}`,
      undefined,
      {"force-reload": forceReload}
    );

    this.logger.debug(
      `Fetched Creative: ${displayAdId} - ${JSON.stringify(response.data)}`
    );

    if ((response.data as DisplayAd).type !== "DISPLAY_AD") {
      throw new Error(
        `crid: ${
          displayAdId
        } - When fetching DisplayAd, another creative type was returned!`
      );
    }

    return response.data;
  }

  // Helper to fetch the Display Ad properties resource with caching
  async fetchDisplayAdProperties(
    displayAdId: string,
    forceReload = false
  ): Promise<PluginProperty[]> {
    const creativePropertyResponse = await super.requestGatewayHelper(
      "GET",
      `${this.outboundPlatformUrl}/v1/creatives/${
        displayAdId
      }/renderer_properties`,
      undefined,
      {"force-reload": forceReload}
    );

    this.logger.debug(
      `Fetched Creative Properties: ${displayAdId} - ${JSON.stringify(
        creativePropertyResponse.data
      )}`
    );

    return creativePropertyResponse.data;
  }

  getEncodedClickUrl(redirectUrls: string[]): string {
    let urls = redirectUrls.slice(0);
    return urls.reduceRight(
      (acc, current) => current + encodeURIComponent(acc),
      ""
    );
  }

  // Method to build an instance context
  // To be overriden to get a custom behavior
  protected async instanceContextBuilder(creativeId: string, forceReload = false): Promise<T> {

    const displayAdP = this.fetchDisplayAd(creativeId, forceReload);
    const displayAdPropsP = this.fetchDisplayAdProperties(creativeId, forceReload);

    const results = await Promise.all([displayAdP, displayAdPropsP]);

    const displayAd = results[0];
    const displayAdProps = results[1];

    const context = {
      displayAd: displayAd,
      properties: new PropertiesWrapper(displayAdProps)
    } as T;

    return Promise.resolve(context);
  }

  protected abstract onAdContents(
    request: AdRendererRequest,
    instanceContext: T
  ): Promise<AdRendererPluginResponse>;

  private initAdContentsRoute(): void {
    this.app.post(
      "/v1/ad_contents",
      this.asyncMiddleware(
        async (req: express.Request, res: express.Response) => {
          if (!req.body || _.isEmpty(req.body)) {
            const msg = {
              error: "Missing request body"
            };
            this.logger.error("POST /v1/ad_contents : %s", JSON.stringify(msg));
            return res.status(500).json(msg);
          } else {
            this.logger.debug(
              `POST /v1/ad_contents ${JSON.stringify(req.body)}`
            );

            const adRendererRequest = req.body as AdRendererRequest;

            if (!this.onAdContents) {
              this.logger.error(
                "POST /v1/ad_contents: No AdContents listener registered!"
              );
              const msg = {
                error: "No AdContents listener registered!"
              };
              return res.status(500).json(msg);
            }

            // We flush the Plugin Gateway cache during previews
            const forceReload = (adRendererRequest.context === "PREVIEW" || adRendererRequest.context === "STAGE")

            if (
              !this.pluginCache.get(adRendererRequest.creative_id) ||
              forceReload
            ) {
              this.pluginCache.put(
                adRendererRequest.creative_id,
                this.instanceContextBuilder(adRendererRequest.creative_id, forceReload),
                this.INSTANCE_CONTEXT_CACHE_EXPIRATION
              );
            }

            const instanceContext: T = await this.pluginCache.get(
              adRendererRequest.creative_id
            );

            const adRendererResponse = await this.onAdContents(
              adRendererRequest,
              instanceContext as T
            );

            return res
              .header(
                this.displayContextHeader,
                jsesc(adRendererResponse.displayContext, {json: true})
              )
              .status(200)
              .send(adRendererResponse.html);
          }
        }
      )
    );
  }

  constructor(enableThrottling = false) {
    super(enableThrottling);

    this.initAdContentsRoute();
    this.setErrorHandler();
  }
}
