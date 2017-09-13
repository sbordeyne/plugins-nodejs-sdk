import { UserActivity } from "../../../../index";

export interface BidOptimizerPluginResponse {
  bids: Bid[];
}

export interface Bid{
  index: number;
  bid_price: number;
  sale_condition_id: string;
  debug?: string;
  model_id?: string;
  model_parameter?: string;
}