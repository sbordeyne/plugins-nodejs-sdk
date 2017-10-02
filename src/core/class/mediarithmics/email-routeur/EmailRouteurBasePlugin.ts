import * as express from "express";
import * as _ from "lodash";
import * as cache from "memory-cache";

import {
  ActivityAnalyzerBaseInstanceContext,
  BasePlugin,
  PluginProperty,
  Creative,
  EmailRouteurBaseInstanceContext,
  EmailRoutingRequest,
  EmailRouteurPluginResponse,
  CheckEmailsRequest
} from "../../../index";

export abstract class EmailRouteurPlugin extends BasePlugin {
  instanceContext: Promise<EmailRouteurBaseInstanceContext>;

  async fetchEmailRouteurProperties(id: string): Promise<PluginProperty[]> {
    const response = await super.requestGatewayHelper(
      "GET",
      `${this.outboundPlatformUrl}/v1/email_routers/${id}/properties`
    );
    this.logger.debug(
      `Fetched Email Routeur Properties: ${id} - ${JSON.stringify(
        response.data
      )}`
    );
    return response.data;
  }

  // Method to build an instance context
  // To be overriden to get a cutom behavior
  // This is a default provided implementation
  protected async instanceContextBuilder(
    routeurId: string
  ): Promise<EmailRouteurBaseInstanceContext> {
    const emailRouteurProps = await this.fetchEmailRouteurProperties(routeurId);

    const context: EmailRouteurBaseInstanceContext = {
      routeurProperties: emailRouteurProps
    };

    return context;
  }

  // To be overriden by the Plugin to get a custom behavior
  protected abstract onEmailRouting(
    request: EmailRoutingRequest,
    instanceContext: EmailRouteurBaseInstanceContext
  ): Promise<EmailRouteurPluginResponse>;

  private initEmailRouting(): void {
    this.app.post(
      "/v1/email_routing",
      (req: express.Request, res: express.Response) => {
        if (!req.body || _.isEmpty(req.body)) {
          const msg = {
            error: "Missing request body"
          };
          this.logger.error("POST /v1/email_routing : %s", JSON.stringify(msg));
          res.status(500).json(msg);
        } else {
          this.logger.debug(
            `POST /v1/email_routing ${JSON.stringify(req.body)}`
          );

          const emailRoutingRequest = req.body as EmailRoutingRequest;

          if (!this.onEmailRouting) {
            throw new Error("No Email Routing listener registered!");
          }

          if (!this.pluginCache.get(emailRoutingRequest.email_router_id)) {
            this.pluginCache.put(
              emailRoutingRequest.email_router_id,
              this.instanceContextBuilder(emailRoutingRequest.email_router_id),
              this.INSTANCE_CONTEXT_CACHE_EXPIRATION
            );
          }

          this.pluginCache
            .get(emailRoutingRequest.email_router_id)
            .then((instanceContext: EmailRouteurBaseInstanceContext) => {
              return this.onEmailRouting(
                emailRoutingRequest,
                instanceContext
              ).then(response => {
                this.logger.debug(`Returning: ${JSON.stringify(response)}`);
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

   // To be overriden by the Plugin to get a custom behavior
   protected abstract onEmailCheck(
    request: CheckEmailsRequest,
    instanceContext: EmailRouteurBaseInstanceContext
  ): Promise<EmailRouteurPluginResponse>;

  private initEmailCheck(): void {
    this.app.post(
      "/v1/email_router_check",
      (req: express.Request, res: express.Response) => {
        if (!req.body || _.isEmpty(req.body)) {
          const msg = {
            error: "Missing request body"
          };
          this.logger.error("POST /v1/email_router_check : %s", JSON.stringify(msg));
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
            .then((instanceContext: EmailRouteurBaseInstanceContext) => {
              return this.onEmailCheck(
                emailCheckRequest,
                instanceContext
              ).then(response => {
                this.logger.debug(`Returning: ${JSON.stringify(response)}`);
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
    this.initEmailRouting();
    this.initEmailCheck();
  }
}
