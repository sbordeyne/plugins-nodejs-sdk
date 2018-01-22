import { UserPointIdentifierInfo, UserEmailIdentifierInfo, UserAccountIdentifierInfo, UserAgentIdentifierInfo } from "../../../../index";

export interface RecommenderRequest {
  recommender_id: string;
  datamart_id: string;
  user_identifiers: (UserPointIdentifierInfo | UserEmailIdentifierInfo | UserAccountIdentifierInfo | UserAgentIdentifierInfo)[];

  input_data: any;
}

export interface RecommenderResponse {
  status: string;
  data: RecommandationsWrapper;
}

export interface RecommandationsWrapper {
  ts: number;
  proposals: ItemProposal[];
  recommendation_log: string;
}

export type ProposalType =
  | "ITEM_PROPOSAL"
  | "PRODUCT_PROPOSAL"
  | "CATEGORY_PROPOSAL"
  | "CONTENT_PROPOSAL";

export interface Proposal {
  $type: ProposalType;
  $id?: string;
  $gid?: string;

  //Customizable
  [propsName: string]: any;
}

export interface ProductProposal extends Proposal {
  $price?: number;
  $salePrice?: number;
  $discountPercentage?: number;
  $currency?: string;
}

export interface ItemProposal extends ProductProposal {
  $name?: string;
  $brand?: string;
  $url?: string;
  $description?: string;
  $imageUrl?: string;
}
