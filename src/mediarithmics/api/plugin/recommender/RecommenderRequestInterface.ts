import {UserAccountIdentifierInfo, UserAgentIdentifierInfo, UserEmailIdentifierInfo, UserPointIdentifierInfo} from '../../reference/UserIdentifierInterface';

export interface RecommenderRequest {
  recommender_id: string;
  datamart_id: string;
  user_identifiers: (UserPointIdentifierInfo | UserEmailIdentifierInfo | UserAccountIdentifierInfo | UserAgentIdentifierInfo)[];
  input_data: any;
}