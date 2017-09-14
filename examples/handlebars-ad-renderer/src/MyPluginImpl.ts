import { core, extra } from "@mediarithmics/plugins-nodejs-sdk";

export class MyHandlebarsAdRenderer extends core.AdRendererRecoTemplatePlugin {
    protected async onAdContents(
      adRenderRequest: core.AdRendererRequest,
      instanceContext: core.AdRendererRecoTemplateInstanceContext
    ): Promise<core.AdRendererPluginResponse> {
      const recommendations: Array<
        core.ItemProposal
      > = await this.fetchRecommendations(
        instanceContext,
        adRenderRequest.user_agent_id
      );
  
      const engine = this.engineBuilder;
  
      const properties: extra.HandleBarRootContext = {
        creative: {
          properties: instanceContext.creative,
          click_url: instanceContext.creative_click_url
        },
        recommendations: recommendations,
        clickableContents: [],
        redirectUrls: adRenderRequest.click_urls,
        request: adRenderRequest
      };
  
      this.logger.debug(
        `CallId: ${adRenderRequest.call_id} - Loading template with properties: ${JSON.stringify(
          properties,
          null,
          4
        )}`
      );
  
      this.logger.debug(
        `CallId: ${adRenderRequest.call_id} - Injecting the rootContext into the compiledTemplate`
      );
      const html = instanceContext.compiled_template(properties); //fill the properties
      this.logger.debug(
        `CallId: ${adRenderRequest.call_id} - HTML returned by Handlebars: ${html}`
      );
  
      return {
        html: html,
        displayContext: {
          $clickable_contents: properties.clickableContents
        }
      };
    }
  
    constructor() {
      super();
      this.engineBuilder = new extra.HandlebarsEngine();
    }
  }