import {map} from '../../../utils'

import {
  AdRendererBaseInstanceContext, 
  AdRendererBasePlugin
} from '../base/AdRendererBasePlugin';
import { TemplatingEngine } from "../../common/TemplatingInterface";

export interface AdRendererTemplateInstanceContext
extends AdRendererBaseInstanceContext {
  width: string;
  height: string;
  creative_click_url?: string;
  render_click_url?: (...args: any[]) => string;
  ias_client_id?: string;
  render_additional_html?: (...args: any[]) => string;
}

export abstract class AdRendererTemplatePlugin extends AdRendererBasePlugin<AdRendererBaseInstanceContext> {

  /**
 * The engineBuilder that can be used to compile the template
 * during the InstanceContext building
 * 
 * Have to be overriden (see examples)
 */
  protected abstract engineBuilder: TemplatingEngine<any, any, any>;

  /**
   * Build a basic InstanceContext for "template" aware AdRenderer.
   * This method can be overriden by your implementation (and you can then still call it with `super.instanceContextBuilder(creativeId, forceReload)`)
   * 
   * This instanceContext takes the hypothesis that:
   * - You have exactly one "URL" Plugin property on your instance
   * - You have one "STRING" Plugin property on your instance called "additional_html" that contains 'templateable' HTML
   * - You have one "STRING" Plugin property on your instance called "ias_client_id" that contains an IAS Client Id as a String
   * 
   * If your Plugin instance don't respect those hypothesis, the returned InstanceContext will have `undefined` values in some/all fields.
   * 
   * If you want to do Templating but you don't want to validate the above hypothesis, you're encouraged to build your Plugin Impl. by extending `AdRendererBasePlugin<AdRendererBaseInstanceContext>`
   * instead of this class. This class should then only be used as an example.
   * 
   * @param creativeId 
   * @param forceReload 
   */
  protected async instanceContextBuilder(
    creativeId: string,
    forceReload = false
  ): Promise<AdRendererTemplateInstanceContext> {
    const baseInstanceContext = await super.instanceContextBuilder(creativeId, forceReload);

    if (!this.engineBuilder) {
      throw new Error(`No engine builder have been added to the plugin
            An engine builder is mandatory to extend this plugin class`);
    }

    this.engineBuilder.init();

    const urlProperty = baseInstanceContext.properties.findUrlProperty();

    if (!urlProperty) {
      const msg = `crid: ${creativeId} - url property is undefined`;
      this.logger.warn(msg);
    }

    const creativeClickUrl = map(urlProperty, p => p.value.url)
      
    const compiledClickUrl = 
      map(creativeClickUrl, 
        url => this.engineBuilder.compile(url));
    
    const additionalHTMLProperty = baseInstanceContext.properties.findStringProperty("additional_html");

    const additionalHTML = 
      map(additionalHTMLProperty,
        p => p.value.value)

    const compiledAdditionalHTML = 
      map(additionalHTML,
        html => this.engineBuilder.compile(html));

    const IASProperty = baseInstanceContext.properties.findStringProperty("ias_client_id")

    const IASClientId = 
      map(IASProperty,
        p => p.value.value);

    const width = baseInstanceContext.displayAd.format.split("x")[0];
    const height = baseInstanceContext.displayAd.format.split("x")[1];

    const context: AdRendererTemplateInstanceContext = {
      displayAd: baseInstanceContext.displayAd,
      properties: baseInstanceContext.properties,
      width: width,
      height: height,
      creative_click_url: creativeClickUrl,
      render_click_url: compiledClickUrl,
      render_additional_html: compiledAdditionalHTML,
      ias_client_id: IASClientId
    };

    return context;
  }

  constructor(enableThrottling = false) {
    super(enableThrottling);
  }
}
