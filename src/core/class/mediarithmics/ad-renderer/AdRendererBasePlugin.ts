import * as express from "express";
import * as _ from "lodash";

import {
  AdRendererRequest,
  Creative,
  CreativeResponse,
  AdRendererBaseInstanceContext,
  BasePlugin,
  TemplatingEngine,
  AdRendererPluginResponse,
  PluginProperty
} from "../../../index";

export abstract class AdRendererBasePlugin<
  T extends AdRendererBaseInstanceContext
> extends BasePlugin {
  instanceContext: Promise<T>;

  displayContextHeader = "x-mics-display-context";

  // Helper to fetch the creative resource with caching
  async fetchCreative(creativeId: string): Promise<Creative> {
    const creativeResponse = await super.requestGatewayHelper(
      "GET",
      `${this.outboundPlatformUrl}/v1/creatives/${creativeId}`
    );

    this.logger.debug(
      `Fetched Creative: ${creativeId} - ${JSON.stringify(
        creativeResponse.data
      )}`
    );

    return creativeResponse.data;
  }

  // Helper to fetch the creative properties resource with caching
  async fetchCreativeProperties(creativeId: string): Promise<PluginProperty[]> {
    const creativePropertyResponse = await super.requestGatewayHelper(
      "GET",
      `${this
        .outboundPlatformUrl}/v1/creatives/${creativeId}/renderer_properties`
    );

    this.logger.debug(
      `Fetched Creative Properties: ${creativeId} - ${JSON.stringify(
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
  protected async instanceContextBuilder(creativeId: string): Promise<T> {
    console.warn(`You are using the default InstanceContextBuilder of AdRendererBasePlugin
    Is it really what you want to do?
    `);

    const creativeP = this.fetchCreative(creativeId);
    const creativePropsP = this.fetchCreativeProperties(creativeId);

    const results = await Promise.all([creativeP, creativePropsP]);

    const creative = results[0];
    const creativeProps = results[1];

    const context = {
      creative: creative,
      creativeProperties: creativeProps
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
      (req: express.Request, res: express.Response) => {
        if (!req.body || _.isEmpty(req.body)) {
          const msg = {
            error: "Missing request body"
          };
          this.logger.error("POST /v1/ad_contents : %s", JSON.stringify(msg));
          return res.status(500).json(msg);
        } else {
          this.logger.debug(`POST /v1/ad_contents ${JSON.stringify(req.body)}`);

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

          if (
            !this.pluginCache.get(adRendererRequest.creative_id) ||
            adRendererRequest.context === "PREVIEW" ||
            adRendererRequest.context === "STAGE"
          ) {
            this.pluginCache.put(
              adRendererRequest.creative_id,
              this.instanceContextBuilder(adRendererRequest.creative_id),
              this.INSTANCE_CONTEXT_CACHE_EXPIRATION
            );
          }

          this.pluginCache
            .get(adRendererRequest.creative_id)
            .then((instanceContext: T) =>
              this.onAdContents(adRendererRequest, instanceContext as T)
            )
            .then((adRendererResponse: AdRendererPluginResponse) =>
              res
                .header(
                  this.displayContextHeader,
                  JSON.stringify(adRendererResponse.displayContext)
                )
                .status(200)
                .send(adRendererResponse.html)
            )
            .catch((error: Error) => {
              this.logger.error(
                `Something bad happened : ${error.message} - ${error.stack}`
              );
              return res.status(500).send(error.message + "\n" + error.stack);
            });
        }
      }
    );
  }

  constructor() {
    super();

    this.initAdContentsRoute();
  }
}
