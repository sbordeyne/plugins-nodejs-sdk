import {EmailRendererBaseInstanceContext, EmailRendererPlugin} from '../base/EmailRendererBasePlugin';
import {ExploreableInternalsTemplatingEngine, ProfileDataTemplater} from '../../common/TemplatingInterface';

export interface EmailRendererTemplateInstanceContext
  extends EmailRendererBaseInstanceContext {
  // Raw template to be compiled
  template: any;
  // Compiled template
  render_template?: (...args: any[]) => string;
}

export abstract class EmailRendererTemplatePlugin extends EmailRendererPlugin<EmailRendererTemplateInstanceContext> {

  /**
   * The engineBuilder that can be used to compile the template
   * during the InstanceContext building
   *
   * Have to be overriden (see examples)
   */
  protected abstract engineBuilder: ExploreableInternalsTemplatingEngine<any, any, any, any> & ProfileDataTemplater;

  constructor(enableThrottling = false) {
    super(enableThrottling);
  }
}
