import {
  EmailRendererBaseInstanceContext,
  EmailRendererPlugin
} from '../base/EmailRendererBasePlugin';
import { ExploreableInternalsTemplatingEngine, ProfileDataTemplater } from "../../common/TemplatingInterface";

export interface EmailRendererTemplateInstanceContext
  extends EmailRendererBaseInstanceContext {
  // Raw template to be compiled
  template: any;
  // Compiled template
  render_template?: (...args: any[]) => string;
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
  protected engineBuilder: ExploreableInternalsTemplatingEngine<any, any, any, any> & ProfileDataTemplater;

  constructor(enableThrottling = false) {
    super(enableThrottling);
  }
}
