import { core } from "@mediarithmics/plugins-nodejs-sdk";

export class MyActivityAnalyzerPlugin extends core.ActivityAnalyzerPlugin {
    protected onActivityAnalysis(
      request: core.ActivityAnalyzerRequest,
      instanceContext: core.ActivityAnalyzerBaseInstanceContext
    ): Promise<core.ActivityAnalyzerPluginResponse> {
      const updatedActivity = request.activity;
      const response: core.ActivityAnalyzerPluginResponse = {
        status: "ok",
        data: null
      };
  
      // We add a field on the processed activitynégative
      updatedActivity.processed_by = `${instanceContext.activityAnalyzer
        .group_id}:${instanceContext.activityAnalyzer
        .artifact_id} v.${instanceContext.activityAnalyzer
        .visit_analyzer_plugin_id}`;
  
      response.data = updatedActivity;
  
      return Promise.resolve(response);
    }
  }