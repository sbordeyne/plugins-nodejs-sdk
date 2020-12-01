import { core } from '@mediarithmics/plugins-nodejs-sdk';

export class MyCustomActionPlugin extends core.CustomActionBasePlugin {
  protected onCustomActionCall(
    request: core.CustomActionRequest,
    instanceContext: core.CustomActionBaseInstanceContext
  ): Promise<core.CustomActionPluginResponse> {
    const response: core.CustomActionPluginResponse = {
      status: 'ok',
    };

    return Promise.resolve(response);
  }
}