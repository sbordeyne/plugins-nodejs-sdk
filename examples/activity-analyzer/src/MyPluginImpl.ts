import {core} from '@mediarithmics/plugins-nodejs-sdk';

// Check that we can extend an Activity
export interface MySuperActivity extends core.UserActivity {
  cool_additional_property: string;
}

// Check that we can extend a Generic event
export interface MySuperEvent extends core.GenericUserActivityEvent {
  cool_additional_property: string;
}

export class MyActivityAnalyzerPlugin extends core.ActivityAnalyzerPlugin {

  protected onActivityAnalysis(
    request: core.ActivityAnalyzerRequest,
    instanceContext: core.ActivityAnalyzerBaseInstanceContext
  ): Promise<core.ActivityAnalyzerPluginResponse> {
    const updatedActivity = request.activity;
    const response: core.ActivityAnalyzerPluginResponse = {
      status: 'ok',
      data: null
    };

    // We add a field on the processed activity
    updatedActivity.processed_by = `${instanceContext.activityAnalyzer
      .group_id}:${instanceContext.activityAnalyzer
      .artifact_id} v.${instanceContext.activityAnalyzer
      .visit_analyzer_plugin_id}`;

    // We rename the first event
    updatedActivity.$events[0].$event_name = 'hello';

    response.data = updatedActivity;

    updatedActivity.$events;

    return Promise.resolve(response);
  }
}