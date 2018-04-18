import { UserActivity } from "../../datamart/UserActivityInterface";

export interface BidDecision {
  bids: Bid[];
}

export interface Bid{
  index: number;
  bid_price: number;
  sale_condition_id: string;
  debug?: string;
  model_id?: string;
  model_parameter?: string;
  creative_variant?:string;
}