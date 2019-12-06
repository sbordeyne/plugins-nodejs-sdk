import {UserIdentifierInfo} from '../../../api/reference/UserIdentifierInterface';
import {DataResponse} from '../../../api/core/common/Response';

export type UserCampaignResponse = DataResponse<UserCampaignResource>;

export interface UserCampaignResource {
    user_account_id: string;
    user_agent_ids: Array<string>;
    databag: string;
    user_identifiers: UserIdentifierInfo[];
}
