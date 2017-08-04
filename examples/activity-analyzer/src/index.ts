import {
  ActivityAnalyzerPlugin,
  ActivityAnalyzerRequest,
  ActivityAnalyzerBaseInstanceContext,
  ActivityAnalyzerPluginResponse
} from "@mediarithmics/plugins-nodejs-sdk";
import { MyInstanceContext } from "./interfaces/MyInstanceContextInterface";

// All the magic is here
const plugin = new ActivityAnalyzerPlugin(
  (request: ActivityAnalyzerRequest, instanceContext: MyInstanceContext) => {
    const updatedActivity = request.activity;
    const response = {} as ActivityAnalyzerPluginResponse;

    response.status = "ok";

    // We add a field on the processed activity
    updatedActivity.processed_by = `${instanceContext.activityAnalyzer
      .group_id}:${instanceContext.activityAnalyzer
      .artifact_id} v.${instanceContext.activityAnalyzer
      .visit_analyzer_plugin_id}`;
    updatedActivity.file_content = JSON.stringify(instanceContext.conf);

    response.data = updatedActivity;

    return response;
  }
);

plugin.setInstanceContextBuilder(async activityAnalyzerId => {
  const activityAnalyzerP = plugin.fetchActivityAnalyzer(activityAnalyzerId);
  const activityAnalyzerPropsP = plugin.fetchActivityAnalyzerProperties(
    activityAnalyzerId
  );

  const results = await Promise.all([
    activityAnalyzerP,
    activityAnalyzerPropsP
  ]);

  const activityAnalyzer = results[0];
  const activityAnalyzerProps = results[1];
  const fileUri = activityAnalyzerProps.find(prop => {
    return prop.technical_name === "analyzer_rules";
  }).value.uri;
  const fileContentBinary = await plugin.fetchDataFile(fileUri);
  const fileContent = fileContentBinary.toString();

  const context = {
    activityAnalyzer: activityAnalyzer,
    activityAnalyzerProperties: activityAnalyzerProps,
    conf: JSON.parse(fileContent)
  } as MyInstanceContext;

  return context;
});

plugin.start();
