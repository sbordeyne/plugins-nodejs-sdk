import * as express from "express";
import * as _ from "lodash";

import {
  CustomActionRequest,
  CustomActionPluginResponse,
  CustomAction,
} from "./CustomActionInterface";
import { PluginProperty } from "./../../api/core/plugin/PluginPropertyInterface";
import { BasePlugin } from "../common";

export interface CustomActionBaseInstanceContext {}

export abstract class CustomActionBasePlugin extends BasePlugin {
  constructor(enableThrottling = false) {
    super(enableThrottling);

    this.initCustomAction();
    this.setErrorHandler();
  }

  /**
   *
   * @param customActionId
   */
  async fetchCustomAction(apiToken: string, customActionId: string): Promise<CustomAction> {
    const options = {
      method: 'GET',
      uri: `https://api.mediarithmics.com/v1/scenario_custom_actions/${customActionId}`,
      json: true
    };

    const customActionResponse = await this.requestPublicMicsApiHelper(apiToken, options);

    this.logger.debug(
      `Fetched Custom Action: ${customActionId} - %j`,
      customActionResponse.data
    );

    return customActionResponse.data;
  }

  /**
   *
   * @param customActionId
   */
  async fetchCustomActionProperties(
    apiToken: string,
    customActionId: string
  ): Promise<PluginProperty[]> {
    const options = {
      method: 'GET',
      uri: `https://api.mediarithmics.com/v1/scenario_custom_actions/${customActionId}/properties`,
      json: true
    };

    const customActionPropertiesResponse = await this.requestPublicMicsApiHelper(apiToken, options);

    this.logger.debug(
      `Fetched Custom Action Properties: ${customActionId} - %j`,
      customActionPropertiesResponse.data
    );

    return customActionPropertiesResponse.data;
  }

  protected async instanceContextBuilder(
    customActionId: string
  ): Promise<CustomActionBaseInstanceContext> {
    return {}
  };

  /**
   *
   * @param request
   * @param instanceContext
   */
  protected abstract onCustomActionCall(
    request: CustomActionRequest,
    instanceContext: CustomActionBaseInstanceContext
  ): Promise<CustomActionPluginResponse>;

  protected async getInstanceContext(
    customActionId: string
  ): Promise<CustomActionBaseInstanceContext> {
    if (!this.pluginCache.get(customActionId)) {
      this.pluginCache.put(
        customActionId,
        this.instanceContextBuilder(customActionId),
        this.getInstanceContextCacheExpiration()
      );
    }

    return this.pluginCache.get(customActionId);
  }

  private emptyBodyFilter(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    if (!req.body || _.isEmpty(req.body)) {
      const msg = {
        error: "Missing request body",
      };
      this.logger.error(`POST /v1/${req.url} : %j`, msg);
      res.status(500).json(msg);
    } else {
      next();
    }
  }

  private initCustomAction(): void {
    // route /v1/scenario_custom_actions
    this.app.post(
      "/v1/scenario_custom_actions",
      this.emptyBodyFilter,
      async (req: express.Request, res: express.Response) => {
        try {
          this.logger.debug(`POST /v1/scenario_custom_actions %j`, req.body);

          const request = req.body as CustomActionRequest;

          if (!this.onCustomActionCall) {
            throw new Error("No Scenario Custom Action listener registered!");
          }

          const instanceContext = await this.getInstanceContext(
            request.custom_action_id
          );

          const response = await this.onCustomActionCall(
            request,
            instanceContext
          );

          this.logger.debug(
            `CustomActionId: ${request.custom_action_id} - Plugin impl returned: %j`,
            response
          );

          const pluginResponse: CustomActionPluginResponse = {
            status: response.status,
          };

          let statusCode;

          switch (response.status) {
            case "ok":
              statusCode = 200;
              break;
            case "ko":
              statusCode = 500;
              break;
            default:
              statusCode = 500;
          }

          this.logger.debug(
            `CustomActionId: ${request.custom_action_id} - Returning : ${statusCode} - %j`,
            response
          );

          return res.status(statusCode).send(JSON.stringify(pluginResponse));
        } catch (error) {
          this.logger.error(
            `Something bad happened : ${error.message} - ${error.stack}`
          );
          return res
            .status(500)
            .send({ status: "error", message: `${error.message}` });
        }
      }
    );
  }
}
