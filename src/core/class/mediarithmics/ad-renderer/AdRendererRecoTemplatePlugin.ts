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
  TemplatingEngine,
  AdRendererTemplatePlugin
} from "../../../index";

export abstract class AdRendererRecoTemplatePlugin extends AdRendererTemplatePlugin {
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
      `Recommender ${instanceContext.recommender_id} response : ${JSON.stringify(
        response
      )}`
    );

    return response.data.proposals;
  }

  protected async instanceContextBuilder(creativeId: string) {
    const baseInstanceContext = await super.instanceContextBuilder(creativeId);

    const recommenderProperty = _.find(
      baseInstanceContext.displayAdProperties,
      p => p.technical_name === "recommender_id"
    );

    const context: AdRendererRecoTemplateInstanceContext = {
      ...baseInstanceContext,
      recommender_id: recommenderProperty
        ? recommenderProperty.value.value as string
        : undefined
    };

    return context;
  }

  constructor() {
    super();
  }
}
