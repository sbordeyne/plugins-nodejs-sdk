import * as express from "express";
import * as _ from "lodash";
import * as cache from "memory-cache";

import {
  ActivityAnalyzerBaseInstanceContext,
  BasePlugin,
  PluginProperty,
  Creative,
  EmailRouterBaseInstanceContext,
  EmailRoutingRequest,
  EmailRoutingPluginResponse,
  CheckEmailsRequest,
  CheckEmailsPluginResponse
} from "../../../index";

export abstract class EmailRouterPlugin extends BasePlugin {
  instanceContext: Promise<EmailRouterBaseInstanceContext>;

  async fetchEmailRouterProperties(id: string): Promise<PluginProperty[]> {
    const response = await super.requestGatewayHelper(
      "GET",
      `${this.outboundPlatformUrl}/v1/email_routers/${id}/properties`
    );
    this.logger.debug(
      `Fetched Email Router Properties: ${id} - ${JSON.stringify(
        response.data
      )}`
    );
    return response.data;
  }

  // Method to build an instance context
  // To be overriden to get a cutom behavior
  // This is a default provided implementation
  protected async instanceContextBuilder(
    routerId: string
  ): Promise<EmailRouterBaseInstanceContext> {
    const emailRouterProps = await this.fetchEmailRouterProperties(routerId);

    const context: EmailRouterBaseInstanceContext = {
      routerProperties: emailRouterProps
    };

    return context;
  }

  // To be overriden by the Plugin to get a custom behavior
  protected abstract onEmailRouting(
    request: EmailRoutingRequest,
    instanceContext: EmailRouterBaseInstanceContext
  ): Promise<EmailRoutingPluginResponse>;

  protected async getInstanceContext(
    emailRouterId: string
  ): Promise<EmailRouterBaseInstanceContext> {
    if (!this.pluginCache.get(emailRouterId)) {
      this.pluginCache.put(
        emailRouterId,
        this.instanceContextBuilder(emailRouterId),
        this.INSTANCE_CONTEXT_CACHE_EXPIRATION
      );
    }

    return await this.pluginCache.get(emailRouterId);
  }

  private initEmailRouting(): void {
    this.app.post(
      "/v1/email_routing",
      this.asyncMiddleware(
        async (req: express.Request, res: express.Response) => {
          if (!req.body || _.isEmpty(req.body)) {
            const msg = {
              error: "Missing request body"
            };
            this.logger.error(
              "POST /v1/email_routing : %s",
              JSON.stringify(msg)
            );
            return res.status(500).json(msg);
          } else {
            this.logger.debug(
              `POST /v1/email_routing ${JSON.stringify(req.body)}`
            );

            const emailRoutingRequest = req.body as EmailRoutingRequest;

            if (!this.onEmailRouting) {
              const errMsg = "No Email Routing listener registered!";
              this.logger.error(errMsg);
              return res.status(500).json({ error: errMsg });
            }

            const instanceContext = await this.getInstanceContext(
              emailRoutingRequest.email_router_id
            );
            const pluginResponse = await this.onEmailRouting(
              emailRoutingRequest,
              instanceContext
            );

            this.logger.debug(`Returning: ${JSON.stringify(pluginResponse)}`);
            res.status(200).send(JSON.stringify(pluginResponse));
          }
        }
      )
    );
  }

  // To be overriden by the Plugin to get a custom behavior
  protected abstract onEmailCheck(
    request: CheckEmailsRequest,
    instanceContext: EmailRouterBaseInstanceContext
  ): Promise<CheckEmailsPluginResponse>;

  private initEmailCheck(): void {
    this.app.post(
      "/v1/email_router_check",
      (req: express.Request, res: express.Response) => {
        if (!req.body || _.isEmpty(req.body)) {
          const msg = {
            error: "Missing request body"
          };
          this.logger.error(
            "POST /v1/email_router_check : %s",
            JSON.stringify(msg)
          );
          res.status(500).json(msg);
        } else {
          this.logger.debug(
            `POST /v1/email_router_check ${JSON.stringify(req.body)}`
          );

          const emailCheckRequest = req.body as CheckEmailsRequest;

          if (!this.onEmailRouting) {
            throw new Error("No Email Check listener registered!");
          }

          if (!this.pluginCache.get(emailCheckRequest.email_router_id)) {
            this.pluginCache.put(
              emailCheckRequest.email_router_id,
              this.instanceContextBuilder(emailCheckRequest.email_router_id),
              this.INSTANCE_CONTEXT_CACHE_EXPIRATION
            );
          }

          this.pluginCache
            .get(emailCheckRequest.email_router_id)
            .then((instanceContext: EmailRouterBaseInstanceContext) => {
              return this.onEmailCheck(emailCheckRequest, instanceContext).then(
                response => {
                  this.logger.debug(`Returning: ${JSON.stringify(response)}`);
                  res.status(200).send(JSON.stringify(response));
                }
              );
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
    this.initEmailRouting();
    this.initEmailCheck();
    this.setErrorHandler();
  }
}
