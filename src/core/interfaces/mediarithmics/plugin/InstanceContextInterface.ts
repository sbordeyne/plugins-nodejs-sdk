import {
  BidOptimizer,
  Creative,
  ActivityAnalyzer,
  EmailRouter,
  AudienceFeed,
  PluginProperty,
  DisplayAd
} from "../../../index";

export interface AudienceFeedConnectorBaseInstanceContext {
  feed: AudienceFeed;
  feedProperties: PluginProperty[];
}

export interface EmailRendererBaseInstanceContext {
  creative: Creative;
  creativeProperties: PluginProperty[];
}

export interface EmailRouterBaseInstanceContext {
  routerProperties: PluginProperty[];
}

export interface ActivityAnalyzerBaseInstanceContext {
  activityAnalyzer: ActivityAnalyzer;
  activityAnalyzerProperties: PluginProperty[];
}

export interface BidOptimizerBaseInstanceContext {
  bidOptimizer: BidOptimizer;
  bidOptimizerProperties: PluginProperty[];
}

export interface AdRendererBaseInstanceContext {
  displayAd: DisplayAd;
  displayAdProperties: PluginProperty[];
}

export interface AdRendererTemplateInstanceContext
  extends AdRendererBaseInstanceContext {
  width: string;
  height: string;
  creative_click_url?: string;
  render_click_url?: (...args: any[]) => string;
  // Raw template to be compiled
  template: any;
  // Compiled template
  render_template?: (...args: any[]) => string;
  ias_client_id?: string;
  render_additional_html?: (...args: any[]) => string;
}

export interface AdRendererRecoTemplateInstanceContext
  extends AdRendererTemplateInstanceContext {
  recommender_id?: string;
}
