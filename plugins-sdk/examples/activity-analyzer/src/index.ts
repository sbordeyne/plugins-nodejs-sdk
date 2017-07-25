import {
    ActivityAnalyzerPlugin,
    ActivityAnalyzerRequest,
    ActivityAnalyzerBaseInstanceContext,
    ActivityAnalyzerPluginResponse
} from '@mediarithmics/plugins-sdk';

// All the magic is here
const plugin = new ActivityAnalyzerPlugin((request: ActivityAnalyzerRequest, instanceContext: ActivityAnalyzerBaseInstanceContext) => {

    const response = {} as ActivityAnalyzerPluginResponse;

    response.status = "ok";
    response.data = request.activity;

    return response;
});