import {core} from '@mediarithmics/plugins-nodejs-sdk';
import {EmailRenderRequest} from '@mediarithmics/plugins-nodejs-sdk/src/mediarithmics/api/plugin/emailtemplaterenderer/EmailRendererRequestInterface';
import {EmailRendererPluginResponse} from '@mediarithmics/plugins-nodejs-sdk/src/mediarithmics/api/plugin/emailtemplaterenderer/EmailRendererPluginResponse';
import {EmailRendererBaseInstanceContext} from '@mediarithmics/plugins-nodejs-sdk/lib/mediarithmics';

export interface ExampleEmailRendererConfigurationFileProperties {
  apiToken: string;
}

export class ExampleEmailRenderer extends core.EmailRendererPlugin {
  constructor(enableThrottling = false) {
    super(enableThrottling);
  }

  private async getConfigurationFileProperties(): Promise<ExampleEmailRendererConfigurationFileProperties> {
    const configurationFileName = 'configuration_file';
    const configurationFile = await this.fetchConfigurationFile(configurationFileName);
    const configuration = JSON.parse(configurationFile.toString());
    if (!configuration['mics_api_token']) {
      this.logger.error(`api token is missing!`);
      throw new Error(`api token is missing!`);
    }
    return {
      apiToken: configuration['mics_api_token']
    };
  }

  async getAdditionalUserData(userPointId: string, apiToken: string): Promise<any> {
    // get data from api request to mediarithmics, for instance date of last visit to site
    return Promise.resolve({lastVisit: 1617975347247});
  }

  async getExternalData(userPointId: string): Promise<any> {
    // get data from external source
    return Promise.resolve(true);
  }

  protected async onEmailContents(
      request: EmailRenderRequest,
      instanceContext: EmailRendererBaseInstanceContext
  ): Promise<EmailRendererPluginResponse> {

    // Fetch identifiers
    const userPointId = core.map(
        request.user_identifiers.find(ident => ident.type == "USER_POINT"),
        ident => (ident as core.UserPointIdentifierInfo).user_point_id
    );
    const userEmail = core.map(
        request.user_identifiers.find(ident => ident.type == "USER_EMAIL"),
        ident => (ident as core.UserEmailIdentifierInfo).email
    );

    if (!userPointId || !userEmail) {
      this.logger.error(`Missing identifiers in request: ${JSON.stringify(request)}`);
      return { meta: {}, content: { text: '' }};
    }

    // get additional data if needed
    const configurationFile = await this.getConfigurationFileProperties();
    const userAdditionalData = await this.getAdditionalUserData(userPointId, configurationFile['apiToken']);

    const emailMeta: core.PluginEmailMeta = {
      to_email: userEmail || undefined,
      to_name: userEmail || undefined
    };

    const emailContent: core.PluginEmailContent = {
      html: "<table><tr><td>Hello world!</td><td>Last visit was " + new Date(userAdditionalData.lastVisit) + "</td></tr></table>"
    };

    return {
      meta: emailMeta, // use this to set email addresses, subject, ...
      content: emailContent, // use this to set content
      data: {} // with this you can provide additional data to the email router
    };
  }
}
