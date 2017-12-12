import { PluginEmailContent, PluginEmailMeta } from "./EmailInterface";

export interface EmailRendererPluginResponse {
  meta: PluginEmailMeta;
  content: PluginEmailContent;
  data?: any;
}