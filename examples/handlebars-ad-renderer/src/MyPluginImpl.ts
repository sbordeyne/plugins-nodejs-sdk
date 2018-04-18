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

    const redirectUrls = adRenderRequest.click_urls;
    if (instanceContext.creative_click_url) {
      redirectUrls.push(instanceContext.creative_click_url);
    }

    const clickUrl = this.getEncodedClickUrl(redirectUrls);

    const properties: extra.RecommendationsHandlebarsRootContext = {
      CREATIVE: {
        CLICK_URL: instanceContext.creative_click_url,
        WIDTH: instanceContext.width,
        HEIGHT: instanceContext.height
      },
      RECOMMENDATIONS: recommendations,
      private: {
        clickableContents: [],
        redirectUrls: adRenderRequest.click_urls
      },
      REQUEST: adRenderRequest,
      ORGANISATION_ID: instanceContext.displayAd.organisation_id, // Hack, it should come from the AdRendererRequest
      AD_GROUP_ID: adRenderRequest.ad_group_id,
      MEDIA_ID: adRenderRequest.media_id,
      CAMPAIGN_ID: adRenderRequest.campaign_id,
      CREATIVE_ID: adRenderRequest.creative_id,
      CACHE_BUSTER: Date.now().toString(),
      CB: Date.now().toString(),
      CLICK_URL: clickUrl,
      ENCODED_CLICK_URL: encodeURIComponent(clickUrl)
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

    const html = instanceContext.render_template(properties); //fill the properties

    this.logger.debug(
      `CallId: ${adRenderRequest.call_id} - HTML returned by Handlebars: ${html}`
    );

    return {
      html: html,
      displayContext: {
        $clickable_contents: properties.private.clickableContents
      }
    };
  }

  constructor(enableThrottling = false) {
    super(enableThrottling);
    this.engineBuilder = new extra.RecommendationsHandlebarsEngine();
  }
}
