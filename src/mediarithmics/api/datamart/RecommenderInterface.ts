import {DataResponse} from '../../api/core/common/Response';
import {Customizable} from '../../api/core/common/Customizable';

export type RecommenderResponse = DataResponse<RecommendationsWrapper>;

export interface RecommendationsWrapper {
  ts: number;
  proposals: ItemProposal[];
  recommendation_log?: string;
}

export type ProposalType =
  | 'ITEM_PROPOSAL'
  | 'PRODUCT_PROPOSAL'
  | 'CATEGORY_PROPOSAL'
  | 'CONTENT_PROPOSAL';

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
