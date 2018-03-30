import * as express from "express";
import * as _ from "lodash";
import * as cache from "memory-cache";

import {
  ActivityAnalyzerBaseInstanceContext,
  BasePlugin,
  PluginProperty,
  Creative,
  EmailRenderRequest,
  EmailRendererPluginResponse,
  EmailRendererBaseInstanceContext
} from "../../../index";

export abstract class EmailRendererPlugin extends BasePlugin {
  instanceContext: Promise<EmailRendererBaseInstanceContext>;

  // Helper to fetch the creative resource with caching
  async fetchCreative(id: string): Promise<Creative> {
    const response = await super.requestGatewayHelper(
      "GET",
      `${this.outboundPlatformUrl}/v1/creatives/${id}`
    );
    this.logger.debug(
      `Fetched Creative: ${id} - ${JSON.stringify(response.data)}`
    );
    return response.data;
  }

  async fetchCreativeProperties(id: string): Promise<PluginProperty[]> {
    const response = await super.requestGatewayHelper(
      "GET",
      `${this.outboundPlatformUrl}/v1/creatives/${id}/renderer_properties`
    );
    this.logger.debug(
      `Fetched Creative Properties: ${id} - ${JSON.stringify(response.data)}`
    );
    return response.data;
  }

  // Method to build an instance context
  // To be overriden to get a cutom behavior
  // This is a default provided implementation
  protected async instanceContextBuilder(
    creativeId: string
  ): Promise<EmailRendererBaseInstanceContext> {
    const creativeP = this.fetchCreative(creativeId);
    const creativePropsP = this.fetchCreativeProperties(creativeId);

    const results = await Promise.all([creativeP, creativePropsP]);

    const creative = results[0];
    const creativeProps = results[1];

    const context: EmailRendererBaseInstanceContext = {
      creative: creative,
      creativeProperties: creativeProps
    };

    return context;
  }

  // Method to process an Activity Analysis
  // To be overriden by the Plugin to get a custom behavior
  protected abstract onEmailContents(
    request: EmailRenderRequest,
    instanceContext: EmailRendererBaseInstanceContext
  ): Promise<EmailRendererPluginResponse>;

  private initEmailContents(): void {
    this.app.post(
      "/v1/email_contents",
      this.asyncMiddleware(
        async (req: express.Request, res: express.Response) => {
          if (!req.body || _.isEmpty(req.body)) {
            const msg = {
              error: "Missing request body"
            };
            this.logger.error(
              "POST /v1/email_contents : %s",
              JSON.stringify(msg)
            );
            return res.status(500).json(msg);
          } else {
            this.logger.debug(
              `POST /v1/email_contents ${JSON.stringify(req.body)}`
            );

            const emailRenderRequest = req.body as EmailRenderRequest;

            if (!this.onEmailContents) {
              const errMsg = "No Email Renderer listener registered!";
              this.logger.error(errMsg);
              return res.status(500).send({ error: errMsg });
            }

            if (!this.pluginCache.get(emailRenderRequest.email_renderer_id)) {
              this.pluginCache.put(
                emailRenderRequest.email_renderer_id,
                this.instanceContextBuilder(
                  emailRenderRequest.email_renderer_id
                ),
                this.INSTANCE_CONTEXT_CACHE_EXPIRATION
              );
            }

            const instanceContext = await this.pluginCache.get(
              emailRenderRequest.email_renderer_id
            );

            const response = await this.onEmailContents(
              emailRenderRequest,
              instanceContext
            );

            this.logger.debug(`Returning: ${JSON.stringify(response)}`);
            return res.status(200).send(JSON.stringify(response));
          }
        }
      )
    );
  }

  constructor(enableThrottling?: boolean) {
    super(enableThrottling);

    // We init the specific route to listen for email contents requests
    this.initEmailContents();
    this.setErrorHandler();
  }
}
