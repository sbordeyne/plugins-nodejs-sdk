import * as express from "express";
import * as _ from "lodash";
import * as cache from "memory-cache";

import {
  BasePlugin,
  Catalog,
  PluginProperty,
  RecommenderBaseInstanceContext,
  RecommenderRequest,
  RecommandationsWrapper,
  RecommenderPluginResponse
} from "../../../index";

export interface RecommenderBaseInstanceContext {
  recommenderProperties: PluginProperty[];
}

export interface RecommenderPluginResponse extends RecommandationsWrapper {}

export abstract class RecommenderPlugin extends BasePlugin {
  instanceContext: Promise<RecommenderBaseInstanceContext>;

    // Helper to fetch the activity analyzer resource with caching
    async fetchRecommenderCatalogs(
        recommenderId: string
      ): Promise<Catalog[]> {
        const recommenderCatalogsResponse = await super.requestGatewayHelper(
          "GET",
          `${this.outboundPlatformUrl}/v1/recommenders/${
            recommenderId
          }/catalogs`
        );
        this.logger.debug(
          `Fetched recommender catalogs: ${recommenderId} - ${JSON.stringify(
            recommenderCatalogsResponse.data
          )}`
        );
        return recommenderCatalogsResponse.data;
      }

  // Helper to fetch the activity analyzer resource with caching
  async fetchRecommenderProperties(
    recommenderId: string
  ): Promise<PluginProperty[]> {
    const recommenderPropertyResponse = await super.requestGatewayHelper(
      "GET",
      `${this.outboundPlatformUrl}/v1/recommenders/${
        recommenderId
      }/properties`
    );
    this.logger.debug(
      `Fetched recommender Properties: ${recommenderId} - ${JSON.stringify(
        recommenderPropertyResponse.data
      )}`
    );
    return recommenderPropertyResponse.data;
  }

  // Method to build an instance context
  // To be overriden to get a cutom behavior
  // This is a default provided implementation
  protected async instanceContextBuilder(
    recommenderId: string
  ): Promise<RecommenderBaseInstanceContext> {

    const recommenderProps = await this.fetchRecommenderProperties(
        recommenderId
      );

    const context: RecommenderBaseInstanceContext = {
      recommenderProperties: recommenderProps
    };

    return context;
  }

  // Method to process an Activity Analysis
  // To be overriden by the Plugin to get a custom behavior
  protected abstract onRecommendationRequest(
    request: RecommenderRequest,
    instanceContext: RecommenderBaseInstanceContext
  ): Promise<RecommenderPluginResponse>;

  private initRecommendationRequest(): void {
    this.app.post(
      "/v1/recommendations",
      this.asyncMiddleware(
        async (req: express.Request, res: express.Response) => {
          if (!req.body || _.isEmpty(req.body)) {
            const msg = {
              error: "Missing request body"
            };
            this.logger.error(
              "POST /v1/recommendations : %s",
              JSON.stringify(msg)
            );
            return res.status(500).json(msg);
          } else {
            this.logger.debug(
              `POST /v1/recommendations ${JSON.stringify(req.body)}`
            );

            const recommenderRequest = req.body as RecommenderRequest;

            if (!this.onRecommendationRequest) {
              const errMsg = "No Recommendation request listener registered!";
              this.logger.error(errMsg);
              return res.status(500).json({ error: errMsg });
            }

            if (
              !this.pluginCache.get(
                recommenderRequest.recommender_id
              )
            ) {
              this.pluginCache.put(
                recommenderRequest.recommender_id,
                this.instanceContextBuilder(
                  recommenderRequest.recommender_id
                ),
                this.INSTANCE_CONTEXT_CACHE_EXPIRATION
              );
            }

            const instanceContext: RecommenderBaseInstanceContext = await this.pluginCache.get(
              recommenderRequest.recommender_id
            );

            const pluginResponse = await this.onRecommendationRequest(
              recommenderRequest,
              instanceContext
            );

            this.logger.debug(`Returning: ${JSON.stringify(pluginResponse)}`);
            return res.status(200).send(JSON.stringify(pluginResponse));
          }
        }
      )
    );
  }

  constructor() {
    super();

    // We init the specific route to listen for activity analysis requests
    this.initRecommendationRequest();
    this.setErrorHandler();
  }
}
