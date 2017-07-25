import * as express from "express";
import * as _ from "lodash";
import * as cache from "memory-cache";

import { AdRendererRequest } from "../../interfaces/mediarithmics/api/AdRendererRequestInterface";

import { ActivityAnalyzerBaseInstanceContext } from "../../interfaces/mediarithmics/plugin/InstanceContextInterface";

import { BasePlugin } from "./BasePlugin";
import { ActivityAnalyzerRequest } from "../../interfaces/mediarithmics/api/ActivityAnalyzerRequestInterface";
import {
  ActivityAnalyzer,
  ActivityAnalyzerResponse
} from "../../interfaces/mediarithmics/api/ActivityAnalyzerInterface";
import {
  ActivityAnalyzerProperty,
  ActivityAnalyzerPropertyResponse
} from "../../interfaces/mediarithmics/api/ActivityAnalyzerPropertyInterface";
import { ActivityAnalyzerPluginResponse } from "../../interfaces/mediarithmics/api/ActivityAnalyzerPluginResponseInterface";

export class ActivityAnalyzerPlugin extends BasePlugin {
  INSTANCE_CONTEXT_CACHE_EXPIRATION: number = 3000;

  instanceContext: Promise<ActivityAnalyzerBaseInstanceContext>;

  // Helper to fetch the activity analyzer resource with caching
  fetchActivityAnalyzer(activityAnalyzerId: string): Promise<ActivityAnalyzer> {
    return super
      .requestGatewayHelper(
        "GET",
        `${this.outboundPlatformUrl}/v1/activity_analyzers/${activityAnalyzerId}`
      )
      .then((result: ActivityAnalyzerResponse) => {
        this.logger.debug(
          `Fetched Activity Analyzer: ${activityAnalyzerId} - ${JSON.stringify(
            result.data
          )}`
        );
        return result.data;
      });
  }

  // Helper to fetch the activity analyzer resource with caching
  fetchActivityAnalyzerProperties(
    activityAnalyzerId: string
  ): Promise<ActivityAnalyzerProperty[]> {
    return super
      .requestGatewayHelper(
        "GET",
        `${this
          .outboundPlatformUrl}/v1/activity_analyzers/${activityAnalyzerId}/properties`
      )
      .then((result: ActivityAnalyzerPropertyResponse) => {
        this.logger.debug(
          `Fetched Creative Properties: ${activityAnalyzerId} - ${JSON.stringify(
            result.data
          )}`
        );
        return result.data;
      });
  }

  // How to bind the main function of the plugin
  setInstanceContextBuilder(
    instanceContextBuilder: (
      activityAnalyzerInstanceId: string
    ) => Promise<ActivityAnalyzerBaseInstanceContext>
  ): void {
    this.buildInstanceContext = instanceContextBuilder;
  }

  // Method to build an instance context
  private buildInstanceContext: (
    creativeId: string
  ) => Promise<ActivityAnalyzerBaseInstanceContext>;

  private onActivityAnalysis: (
    request: ActivityAnalyzerRequest,
    instanceContext: ActivityAnalyzerBaseInstanceContext
  ) => ActivityAnalyzerPluginResponse;

  private initActivityAnalysis(): void {
    this.app.post(
      "/v1/activity_analysis",
      (req: express.Request, res: express.Response) => {
        if (!req.body || _.isEmpty(req.body)) {
          const msg = {
            error: "Missing request body"
          };
          this.logger.error("POST /v1/activity_analysis : %s", msg);
          res.status(500).json(msg);
        } else {
          this.logger.debug(
            `POST /v1/activity_analysis ${JSON.stringify(req.body)}`
          );

          const activityAnalyzerRequest = req.body as ActivityAnalyzerRequest;

          if (!this.onActivityAnalysis) {
            throw new Error("No AdContents listener registered!");
          }

          if (!cache.get(activityAnalyzerRequest.activity_analyzer_id)) {
            cache.put(
              activityAnalyzerRequest.activity_analyzer_id,
              this.buildInstanceContext(
                activityAnalyzerRequest.activity_analyzer_id
              ),
              this.INSTANCE_CONTEXT_CACHE_EXPIRATION
            );
          }

          cache
            .get(activityAnalyzerRequest.activity_analyzer_id)
            .then((instanceContext: ActivityAnalyzerBaseInstanceContext) => {
              const activityAnalyzerResponse = this.onActivityAnalysis(
                activityAnalyzerRequest,
                instanceContext as ActivityAnalyzerBaseInstanceContext
              );
              res.status(200).send(JSON.stringify(activityAnalyzerResponse));
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

  start() {
    this.initActivityAnalysis();
  }
  
  constructor(
    activityAnalysisHandler: (
      request: ActivityAnalyzerRequest,
      instanceContext: ActivityAnalyzerBaseInstanceContext
    ) => ActivityAnalyzerPluginResponse
  ) {
    super();

    this.onActivityAnalysis = activityAnalysisHandler;

    // Default Instance context builder
    this.setInstanceContextBuilder(async (activityAnalyzerId: string) => {
      const activityAnalyzerP = this.fetchActivityAnalyzer(activityAnalyzerId);
      const activityAnalyzerPropsP = this.fetchActivityAnalyzerProperties(
        activityAnalyzerId
      );

      const results = await Promise.all([
        activityAnalyzerP,
        activityAnalyzerPropsP
      ]);

      const activityAnalyzer = results[0];
      const activityAnalyzerProps = results[1];

      const context = {
        activityAnalyzer: activityAnalyzer,
        activityAnalyzerProperties: activityAnalyzerProps
      } as ActivityAnalyzerBaseInstanceContext;

      return context;
    });

  }
}
