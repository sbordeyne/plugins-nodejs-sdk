import {
    UserPointIdentifierInfo,
    UserEmailIdentifierInfo,
    UserAccountIdentifierInfo,
    UserAgentIdentifierInfo
} from "../../../api/reference/UserIdentifierInterface";
import { DataResponse } from "../../../api/core/common/Response";
import { Customizable } from "../../../api/core/common/Customizable";

export interface RecommenderRequest
    extends Customizable {
  recommender_id: string;
  datamart_id: string;
  user_identifiers: (UserPointIdentifierInfo | UserEmailIdentifierInfo | UserAccountIdentifierInfo | UserAgentIdentifierInfo)[];
}

export type RecommenderResponse = DataResponse<RecommandationsWrapper>;

export interface RecommandationsWrapper {
  ts: number;
  proposals: ItemProposal[];
}

export type ProposalType =
  | "ITEM_PROPOSAL"
  | "PRODUCT_PROPOSAL"
  | "CATEGORY_PROPOSAL"
  | "CONTENT_PROPOSAL";

export interface Proposal
    extends Customizable {
  $type: ProposalType;
  $id?: string;
  $gid?: string;

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
