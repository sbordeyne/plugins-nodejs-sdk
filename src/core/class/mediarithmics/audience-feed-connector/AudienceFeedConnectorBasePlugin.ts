import * as express from "express";
import * as _ from "lodash";
import * as cache from "memory-cache";

import {
  BasePlugin,
  PluginProperty,
  AudienceFeedConnectorBaseInstanceContext,
  AudienceFeed,
  UserSegmentUpdateRequest,
  AudienceFeedConnectorPluginResponse
} from "../../../index";

export abstract class ActivityAnalyzerPlugin extends BasePlugin {
  instanceContext: Promise<AudienceFeedConnectorBaseInstanceContext>;

  async fetchAudienceFeed(feedId: string): Promise<AudienceFeed> {
    const response = await super.requestGatewayHelper(
      "GET",
      `${this.outboundPlatformUrl}/v1/external_feeds/${feedId}`
    );
    this.logger.debug(
      `Fetched External Feed: ${feedId} - ${JSON.stringify(response.data)}`
    );
    return response.data;
  }

  async fetchAudienceFeedProperties(feedId: string): Promise<PluginProperty[]> {
    const response = await super.requestGatewayHelper(
      "GET",
      `${this.outboundPlatformUrl}/v1/external_feeds/${feedId}/properties`
    );
    this.logger.debug(
      `Fetched Creative Properties: ${feedId} - ${JSON.stringify(
        response.data
      )}`
    );
    return response.data;
  }

  // Method to build an instance context
  // To be overriden to get a cutom behavior
  // This is a default provided implementation
  protected async instanceContextBuilder(
    feedId: string
  ): Promise<AudienceFeedConnectorBaseInstanceContext> {
    const audienceFeedP = this.fetchAudienceFeed(feedId);
    const audienceFeedPropsP = this.fetchAudienceFeedProperties(feedId);

    const results = await Promise.all([audienceFeedP, audienceFeedPropsP]);

    const audienceFeed = results[0];
    const audienceFeedProps = results[1];

    const context: AudienceFeedConnectorBaseInstanceContext = {
      feed: audienceFeed,
      feedProperties: audienceFeedProps
    };

    return context;
  }

  protected abstract onUserSegmentUpdate(
    request: UserSegmentUpdateRequest,
    instanceContext: AudienceFeedConnectorBaseInstanceContext
  ): Promise<AudienceFeedConnectorPluginResponse>;

  private initUserSegmentUpdate(): void {
    this.app.post(
      "/v1/user_segment_update",
      (req: express.Request, res: express.Response) => {
        if (!req.body || _.isEmpty(req.body)) {
          const msg = {
            error: "Missing request body"
          };
          this.logger.error(
            "POST /v1/user_segment_update : %s",
            JSON.stringify(msg)
          );
          res.status(500).json(msg);
        } else {
          this.logger.debug(
            `POST /v1/user_segment_update ${JSON.stringify(req.body)}`
          );

          const request = req.body as UserSegmentUpdateRequest;

          if (!this.onUserSegmentUpdate) {
            throw new Error("No User Segment Update listener registered!");
          }

          if (!this.pluginCache.get(request.feed_id)) {
            this.pluginCache.put(
              request.feed_id,
              this.instanceContextBuilder(request.feed_id),
              this.INSTANCE_CONTEXT_CACHE_EXPIRATION
            );
          }

          this.pluginCache
            .get(request.feed_id)
            .then(
              (instanceContext: AudienceFeedConnectorBaseInstanceContext) => {
                return this.onUserSegmentUpdate(request, instanceContext);
              }
            )
            .then((response: AudienceFeedConnectorPluginResponse) => {
              this.logger.debug(`Returning: ${JSON.stringify(response)}`);

              const pluginResponse: AudienceFeedConnectorPluginResponse = {
                status: response.status
              };

              if (response.nextMsgDelayInMs) {
                res.set(
                  "x-mics-next-msg-delay",
                  response.nextMsgDelayInMs.toString()
                );
              }

              if (response.message) {
                pluginResponse.message = response.message;
              }

              res.status(200).send(JSON.stringify(pluginResponse));
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

    this.initUserSegmentUpdate();
  }
}
