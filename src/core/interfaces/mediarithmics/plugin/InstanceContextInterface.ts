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
  compiled_click_url?: any;
  // Raw template to be compiled
  template: any;
  // Compiled template
  compiled_template?: any;
  ias_client_id?: string;
  compiled_additional_html?: any;
}

export interface AdRendererRecoTemplateInstanceContext
  extends AdRendererTemplateInstanceContext {
  recommender_id?: string;
}
