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
  async fetchCreative(
    id: string
  ): Promise<Creative> {
    const response = await super.requestGatewayHelper(
      "GET",
      `${this.outboundPlatformUrl}/v1/creatives/${id}`
    );
    this.logger.debug(
      `Fetched Creative: ${id} - ${JSON.stringify(
        response.data
      )}`
    );
    return response.data;
  }

  async fetchCreativeProperties(
    id: string
  ): Promise<PluginProperty[]> {
    const response = await super.requestGatewayHelper(
      "GET",
      `${this
        .outboundPlatformUrl}/v1/creatives/${id}/properties`
    );
    this.logger.debug(
      `Fetched Creative Properties: ${id} - ${JSON.stringify(
        response.data
      )}`
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
    const creativePropsP = this.fetchCreativeProperties(
      creativeId
    );

    const results = await Promise.all([
      creativeP,
      creativePropsP
    ]);

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
    instanceContext: ActivityAnalyzerBaseInstanceContext
  ): Promise<EmailRendererPluginResponse>;

  private initActivityAnalysis(): void {
    this.app.post(
      "/v1/email_contents",
      (req: express.Request, res: express.Response) => {
        if (!req.body || _.isEmpty(req.body)) {
          const msg = {
            error: "Missing request body"
          };
          this.logger.error(
            "POST /v1/email_contents : %s",
            JSON.stringify(msg)
          );
          res.status(500).json(msg);
        } else {
          this.logger.debug(
            `POST /v1/email_contents ${JSON.stringify(req.body)}`
          );

          const emailRenderRequest = req.body as EmailRenderRequest;

          if (!this.onEmailContents) {
            throw new Error("No Email Renderer listener registered!");
          }

          if (
            !this.pluginCache.get(emailRenderRequest.email_renderer_id)
          ) {
            this.pluginCache.put(
              emailRenderRequest.email_renderer_id,
              this.instanceContextBuilder(
                emailRenderRequest.email_renderer_id
              ),
              this.INSTANCE_CONTEXT_CACHE_EXPIRATION
            );
          }

          this.pluginCache
            .get(emailRenderRequest.email_renderer_id)
            .then((instanceContext: ActivityAnalyzerBaseInstanceContext) => {
              return this.onEmailContents(
                emailRenderRequest,
                instanceContext
              ).then(response => {
                this.logger.debug(
                  `Returning: ${JSON.stringify(response)}`
                );
                res.status(200).send(JSON.stringify(response));
              });
            })
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

    // We init the specific route to listen for activity analysis requests
    this.initActivityAnalysis();
  }
}
