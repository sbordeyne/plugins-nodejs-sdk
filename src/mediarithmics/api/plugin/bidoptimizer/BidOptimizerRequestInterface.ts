import {UserAgentInfo} from '../../reference/UserIdentifierInterface';

export type AdSlotVisibility =
  | "ABOVE_THE_FOLD"
  | "MIDDLE_OF_THE_PAGE"
  | "BELOW_THE_FOLD"
  | "UNKNOWN";

export type BidMediaType = "WEB" | "MOBILE_APP" | "VIDEO";

export type BidObjectiveType = "CPC" | "CPA" | "CTR" | "CPV";

export type BidOptimizerModelType =
  | "CATEGORICAL_MODEL"
  | "REGRESSION_MODEL"
  | "DYNAMIC_ALLOCATION";

export interface BidOptimizerRequest {
  bid_info: BidInfo;
  campaign_info: CampaignInfo;
  user_info: UserInfo;
  user_campaign_data_bag: string;
  data_feeds: any[];
}

export interface BidInfo {
  media_type: BidMediaType;
  ad_ex_id: string;
  display_network_id: string;
  media_id: string;
  content_id: string;
  geo_info?: GeoLocationInfo;
  placements?: PlacementInfo[];
}

export interface SaleCondition {
  id: string;
  deal_id?: string;
  floor_price: number;
}

export interface PlacementInfo {
  placement_id: string;
  format: string;
  visibility: AdSlotVisibility;
  viewability: Array<string>;
  sales_conditions: Array<SaleCondition>;
  creative_id: string;
}

export interface CampaignInfo {
  organisation_id: string;
  campaign_id: string;
  ad_group_id: string;
  currency: string;
  date: string;
  max_bid_price: number;
  bid_optimizer_id: string;
  objective_type: BidObjectiveType;
  objective_value: number;
  imp_count?: number;
  avg_win_rate?: number;
  avg_bid_price?: number;
  avg_winning_price?: number;
  avg_delivery_price?: number;
}

export interface UserInfo {
  global_first_view?: Boolean;
  media_first_view?: Boolean;
  user_agent_info?: UserAgentInfo;
}

export interface GeoLocationInfo {
  geo_name_id: number;
  iso_country: string;
  admin1?: string;
  admin2?: string;
  postal_code?: string;
  point_name?: string;
  latitude: number;
  longitude: number;
}
