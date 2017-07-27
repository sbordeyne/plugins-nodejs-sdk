import {
  ActivityAnalyzerPlugin,
  ActivityAnalyzerRequest,
  ActivityAnalyzerBaseInstanceContext,
  ActivityAnalyzerPluginResponse
} from '@mediarithmics/plugins-nodejs-sdk';

// All the magic is here
const plugin = new ActivityAnalyzerPlugin(
  (
    request: ActivityAnalyzerRequest,
    instanceContext: ActivityAnalyzerBaseInstanceContext
  ) => {
    const updatedActivity = request.activity;
    const response = {} as ActivityAnalyzerPluginResponse;

    response.status = "ok";

    // We add a field on the processed activity
    updatedActivity.processed_by = `${instanceContext.activityAnalyzer
      .group_id}:${instanceContext.activityAnalyzer
      .artifact_id} v.${instanceContext.activityAnalyzer
      .visit_analyzer_plugin_id}`;
    response.data = updatedActivity;

    return response;
  }
);

plugin.start();
