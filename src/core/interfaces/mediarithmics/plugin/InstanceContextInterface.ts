import {
  BidOptimizer,
  Creative,
  ActivityAnalyzer,
  PluginProperty,
  EmailRouter,
  DisplayAd
} from "../../../index";

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
  creative: DisplayAd;
  creativeProperties: PluginProperty[];
}

export interface AdRendererTemplateInstanceContext
  extends AdRendererBaseInstanceContext {
  width: string;
  height: string;
  image_url_without_protocol?: string;
  creative_click_url?: string;
  compiled_click_url?: any;
  compiled_viewability_tags?: string[];
  // Raw template to be compiled
  template: any;
  // Compiled template
  compiled_template?: any;
  ias_user_id?: string;
}

export interface AdRendererRecoTemplateInstanceContext
  extends AdRendererTemplateInstanceContext {
  recommender_id?: string;
}
