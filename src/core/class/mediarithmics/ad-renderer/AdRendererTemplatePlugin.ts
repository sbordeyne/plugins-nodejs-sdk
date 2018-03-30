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
  AdRendererTemplateInstanceContext,
  ViewabilityTags
} from "../../../index";

export abstract class AdRendererTemplatePlugin extends AdRendererBasePlugin<
  AdRendererTemplateInstanceContext
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
 * The engineBuilder that can be used to compile the template
 * during the InstanceContext building
 * 
 * Have to be overriden (see examples)
 */
  protected engineBuilder: TemplatingEngine<any, any, any>;

  protected async instanceContextBuilder(
    creativeId: string,
    template?: string
  ): Promise<AdRendererTemplateInstanceContext> {
    const baseInstanceContext = await super.instanceContextBuilder(creativeId);

    const urlProperty = _.find(
      baseInstanceContext.displayAdProperties,
      p => p.property_type === "URL"
    );

    if (!urlProperty) {
      const msg = `crid: ${creativeId} - url property is undefined`;
      this.logger.warn(msg);
    }

    const IASProperty = _.find(
      baseInstanceContext.displayAdProperties,
      p => p.technical_name === "ias_client_id"
    );

    const additionalHTMLProperty = _.find(
      baseInstanceContext.displayAdProperties,
      p => p.technical_name === "additional_html"
    );

    // If no 'predefined' template was provided, we retrieve it from the platform
    if (!template) {
      const adLayoutProperty = _.find(
        baseInstanceContext.displayAdProperties,
        p => p.property_type === "AD_LAYOUT"
      );

      if (
        !adLayoutProperty ||
        !adLayoutProperty.value ||
        !adLayoutProperty.value.id ||
        !adLayoutProperty.value.version
      ) {
        const msg = `crid: ${creativeId} - Ad layout undefined`;
        this.logger.error(msg);
        throw new Error(msg);
      }

      const templateProperties = await this.fetchTemplateProperties(
        baseInstanceContext.displayAd.organisation_id,
        adLayoutProperty.value.id,
        adLayoutProperty.value.version
      );

      this.logger.info(
        `crid: ${creativeId} - Loaded template properties
        ${adLayoutProperty.value.id} ${adLayoutProperty.value.version} => 
        ${JSON.stringify(templateProperties)}`
      );

      const templatePath = templateProperties.data.template;

      // We assume that the template is in UTF-8
      template = (await this.fetchTemplateContent(templatePath)).toString(
        "utf8"
      );

      this.logger.info(
        `crid: ${creativeId} - Loaded template content ${templatePath} =>
        ${JSON.stringify(template)}`
      );
    }

    if (!this.engineBuilder) {
      throw new Error(`No engine builder have been added to the plugin
            An engine builder is mandatory to extend this plugin class`);
    }

    this.engineBuilder.init();
    const compiledTemplate = this.engineBuilder.compile(template);

    const creativeClickUrl =
      urlProperty && urlProperty.value.url ? urlProperty.value.url : undefined;
    const compiledClickUrl = creativeClickUrl
      ? this.engineBuilder.compile(creativeClickUrl)
      : undefined;

    const additionalHTML =
      additionalHTMLProperty &&
      additionalHTMLProperty.value &&
      additionalHTMLProperty.value.value
        ? this.engineBuilder.compile(additionalHTMLProperty.value
            .value as string)
        : undefined;

    const IASClientId =
      IASProperty && IASProperty.value && IASProperty.value.value
        ? IASProperty.value.value as string
        : undefined;

    const width = baseInstanceContext.displayAd.format.split("x")[0];
    const height = baseInstanceContext.displayAd.format.split("x")[1];

    const context: AdRendererTemplateInstanceContext = {
      displayAd: baseInstanceContext.displayAd,
      displayAdProperties: baseInstanceContext.displayAdProperties,
      width: width,
      height: height,
      creative_click_url: creativeClickUrl,
      compiled_click_url: compiledClickUrl,
      template: template,
      compiled_template: compiledTemplate,
      compiled_additional_html: additionalHTML,
      ias_client_id: IASClientId
    };

    return context;
  }

  constructor(disableThrottling?: boolean) {
    super(disableThrottling);
  }
}
