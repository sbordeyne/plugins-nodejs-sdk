import {
  BidOptimizer,
  Creative,
  ActivityAnalyzer,
  EmailRouter,
  AudienceFeed,
  PluginProperty,
  DisplayAd
} from "../../../index";

import { Index } from '../../../utils';

export interface BaseIntanceContext {
  properties: PluginProperty[];
  normalizedProperties: Index<PluginProperty>;
}

export interface AudienceFeedConnectorBaseInstanceContext {
    feed: AudienceFeed;
    feedProperties: PluginProperty[];
}

export interface EmailRendererBaseInstanceContext
  extends BaseIntanceContext {
  creative: Creative;
}

export interface EmailRouterBaseInstanceContext
  extends BaseIntanceContext {
}

export interface ActivityAnalyzerBaseInstanceContext
  extends BaseIntanceContext {
  activityAnalyzer: ActivityAnalyzer;
}

export interface BidOptimizerBaseInstanceContext
  extends BaseIntanceContext {
  bidOptimizer: BidOptimizer;
}

export interface AdRendererBaseInstanceContext
  extends BaseIntanceContext {
  displayAd: DisplayAd;
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
