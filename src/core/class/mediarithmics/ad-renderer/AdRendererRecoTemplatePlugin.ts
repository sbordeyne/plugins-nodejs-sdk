import * as _ from "lodash";
import {
  ItemProposal,
  Creative,
  AdRendererRequest,
  UserCampaignResponse,
  UserCampaignResource,
  AdRendererRecoTemplateInstanceContext,
  AdRendererBasePlugin,
  RecommenderResponse,
  TemplatingEngine
} from "../../../index";

export abstract class AdRendererRecoTemplatePlugin extends AdRendererBasePlugin<
  AdRendererRecoTemplateInstanceContext
> {
  /**
 * Helper to fetch the content of a template
 * @param templatePath  The raw (e.g. non URL encoded) mics URI to the template file as a string.
 * @returns       A Buffer with the file content in it. This have to be decoded with the proper encoding.
 */
  async fetchTemplateContent(templatePath: string): Promise<Buffer> {
    const templateContent = await super.fetchDataFile(templatePath);

    this.logger.debug(`Fetched template : ${templateContent}`);
    return templateContent;
  }

/**
 * Helper to fetch the properties of a template
 */
  async fetchTemplateProperties(
    organisationId: string,
    adLayoutId: string,
    versionId: string
  ): Promise<any> {
    const templateProperties = await super.requestGatewayHelper(
      "GET",
      `${this
        .outboundPlatformUrl}/v1/ad_layouts/${adLayoutId}/versions/${versionId}?organisation_id=${organisationId}`
    );

    return templateProperties;
  }

  /**
 * Helper to fetch the User Campaign
 * @param campaignId  The campaignId -> should come from the AdRendererRequest
 * @param userCampaignId  The userCampaignId -> should come from the AdRendererRequest
 * @returns       A Promise of the User Campaign
 */
  async fetchUserCampaign(
    campaignId: string,
    userCampaignId: string
  ): Promise<UserCampaignResource> {
    let userCampaignResponse: UserCampaignResponse;
    try {
      userCampaignResponse = await super.requestGatewayHelper(
        "GET",
        `${this
          .outboundPlatformUrl}/v1/display_campaigns/${campaignId}/user_campaigns/${userCampaignId}`
      );
    } catch (e) {
      this.logger
        .error(`User campaign could not be fetched for: ${campaignId} - ${userCampaignId}
Returning empty user campaign
Error: ${e.message} - ${e.stack}`);

      userCampaignResponse = {
        status: "ok",
        data: {
          user_account_id: "null",
          user_agent_ids: ["null"],
          databag: "",
          user_identifiers: []
        },
        count: 0
      };
    }

    return userCampaignResponse.data;
  }

  /**
 * Helper to fetch the User recommendations
 * @param instanceContext  The instanceContext -> contains the recommender_id of the creative
 * @param userAgentId  The userAgentId as a string -> should come from the AdRendererRequest (recommended) or from the UserCampaign
 * @returns       A Promise of the Recommendations
 */
  async fetchRecommendations(
    instanceContext: AdRendererRecoTemplateInstanceContext,
    userAgentId: string
  ): Promise<Array<ItemProposal>> {

    // Without any recommender, we return an empty array
    if (!instanceContext.recommender_id) {
      return Promise.resolve([]);
    }

    const uri = `${this
      .outboundPlatformUrl}/v1/recommenders/${instanceContext.recommender_id}/recommendations`;

    const body = {
      recommender_id: instanceContext.recommender_id,
      input_data: {
        user_agent_id: userAgentId
      }
    };

    this.logger.debug(`POST: ${uri} - ${JSON.stringify(body)}`);

    const response: RecommenderResponse = await super.requestGatewayHelper(
      "POST",
      uri,
      body
    );

    this.logger.debug(
      `Recommender ${instanceContext.recommender_id} response : ${JSON.stringify(response)}`
    );

    return response.data.proposals;
  }

  /**
 * The engineBuilder that can be used to compile the template
 * during the InstanceContext building
 * 
 * Have to be overriden (see examples)
 */
  protected engineBuilder: TemplatingEngine<any, any, any>;

  protected async instanceContextBuilder(creativeId: string) {
    console.warn(`You are using the default InstanceContextBuilder of AdRendererRecoTemplatePlugin
    Is it really what you want to do?
    `);
    const creativeP = this.fetchCreative(creativeId);
    const creativePropsP = this.fetchCreativeProperties(creativeId);

    const results = await Promise.all([creativeP, creativePropsP]);

    const creative = results[0];
    const creativeProperties = results[1];

    const adLayoutProperty = _.find(
      creativeProperties,
      p => p.property_type === "AD_LAYOUT"
    );

    const urlProperty = _.find(
      creativeProperties,
      p => p.property_type === "URL"
    );

    const recommenderProperty = _.find(
      creativeProperties,
      p => p.technical_name === "recommender_id"
    );

    if (!adLayoutProperty) {
      this.logger.error("Ad layout undefined");
    }

    if (!urlProperty) {
      this.logger.error("url property is undefined");
    }

    const templateProperties = await this.fetchTemplateProperties(
      creative.organisation_id,
      adLayoutProperty.value.id,
      adLayoutProperty.value.version
    );

    this.logger.info(
      "Loaded template properties %d %d => %j",
      adLayoutProperty.value.id,
      adLayoutProperty.value.version,
      JSON.stringify(templateProperties)
    );

    const templatePath = templateProperties.data.template;

    // We assume that the template is in UTF-8
    const template = (await this.fetchTemplateContent(templatePath)).toString(
      "utf8"
    );

    this.logger.info(
      "Loaded template content %s => %j",
      templatePath,
      JSON.stringify(template)
    );

    if (!this.engineBuilder) {
      throw new Error(`No engine builder have been added to the plugin
            An engine builder is mandatory to extend this plugin class`);
    }

    this.engineBuilder.init();
    const compiledTemplate = this.engineBuilder.compile(template);

    const context: AdRendererRecoTemplateInstanceContext = {
      creative: creative,
      creativeProperties: creativeProperties,
      recommender_id: recommenderProperty
        ? recommenderProperty.value.value as string
        : null,
      creative_click_url: urlProperty.value.url ? urlProperty.value.url : null,
      ad_layout_id: adLayoutProperty.value.id
        ? adLayoutProperty.value.id
        : null,
      ad_layout_version: adLayoutProperty.value.version
        ? adLayoutProperty.value.version
        : null,
      template: template,
      compiled_template: compiledTemplate
    };

    return context;
  }

  constructor() {
    super();
  }
}
