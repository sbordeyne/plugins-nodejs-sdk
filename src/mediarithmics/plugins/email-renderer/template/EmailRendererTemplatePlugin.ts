import * as _ from "lodash";
import {map} from '../../../utils'

import {
    EmailRendererBaseInstanceContext, 
    EmailRendererPlugin
} from '../base/EmailRendererBasePlugin';
import { TemplatingEngine, ExploreableInternalsTemplatingEngine, ProfileDataTemplater, ProfileDataProviderOpts } from "../../common/TemplatingInterface";

export interface EmailRendererTemplateInstanceContext
extends EmailRendererBaseInstanceContext {
  // Raw template to be compiled
  template: any;
  // Compiled template
  render_template?: (...args: any[]) => string;
  // Indicate if the Plugin impl. should map any
  need_profile_data_layer: boolean;
}

export abstract class EmailRendererTemplatePlugin extends EmailRendererPlugin<EmailRendererTemplateInstanceContext> {
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
 * The engineBuilder that can be used to compile the template
 * during the InstanceContext building
 * 
 * Have to be overriden (see examples)
 */
  protected engineBuilder: ExploreableInternalsTemplatingEngine<any, string, (...args: any[]) => string, hbs.AST.Program> & ProfileDataTemplater;

  protected async instanceContextBuilder(
    creativeId: string
  ): Promise<EmailRendererTemplateInstanceContext> {
    const baseInstanceContext = await super.instanceContextBuilder(creativeId);

    const templatePathProperty = baseInstanceContext.properties.findDataFileProperty("handlebars_template");

    const templatePath = map(templatePathProperty, (prop) =>  map(prop.value, (value) => value.uri ));

    if(!templatePath) {
        const msg = `crid: ${creativeId} - No Handlebars template file was found.`;
        this.logger.error(msg);
        throw new Error(msg);
    }

      // We assume that the template is in UTF-8
      const template = (await this.fetchTemplateContent(templatePath)).toString(
        "utf8"
      );

      this.logger.debug(
        `crid: ${creativeId} - Loaded template content ${templatePath} =>
        ${JSON.stringify(template)}`
      );

    if (!this.engineBuilder) {
      throw new Error(`No engine builder have been added to the plugin
            An engine builder is mandatory to extend this plugin class`);
    }

    this.engineBuilder.init();

    const compiledTemplate = this.engineBuilder.compile(template);

    this.engineBuilder.setProfileDataProvider(this.profileDataProvider)

    const context: EmailRendererTemplateInstanceContext = {
      ...baseInstanceContext,
      template: template,
      render_template: compiledTemplate
    };

    return context;
  }

  profileDataProvider(fieldName: string, opts?: ProfileDataProviderOpts): Promise<string> {
    return Promise.resolve("toto");
  }

  constructor(enableThrottling = false) {
    super(enableThrottling);
  }
}
