import { PluginEmailContent, PluginEmailMeta } from "../common/EmailInterface";

export interface EmailRendererPluginResponse {
  meta?: PluginEmailMeta;
  content: PluginEmailContent;
  data?: any;
}