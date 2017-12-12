import {
    UserPointIdentifierInfo,
    UserEmailIdentifierInfo,
    UserAccountIdentifierInfo,
    UserAgentIdentifierInfo
} from "../../../api/reference/UserIdentifierInterface";
import { ResponseData } from "../../../api/core/common/Response";

export interface RecommenderRequest {
  recommender_id: string;
  datamart_id: string;
  user_identifiers: (UserPointIdentifierInfo | UserEmailIdentifierInfo | UserAccountIdentifierInfo | UserAgentIdentifierInfo)[];

  //Customizable
  [propsName: string]: any;
}

export type RecommenderResponse = ResponseData<RecommandationsWrapper>;

export interface RecommandationsWrapper {
  ts: number;
  proposals: ItemProposal[];
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
