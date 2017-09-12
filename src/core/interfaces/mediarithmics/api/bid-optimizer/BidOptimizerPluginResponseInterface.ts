import { UserActivity } from "../../../../index";

export interface BidOptimizerPluginResponse {
  bids: Bid[];
}

export interface Bid{
  index: number;
  bidPrice: number;
  saleConditionId: string;
  debug?: string;
  modelId?: string;
  modelParameter?: string;
  creativeVariant?: string;
}