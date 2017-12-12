import { UserPointIdentifierInfo, UserEmailIdentifierInfo, UserAccountIdentifierInfo, UserAgentIdentifierInfo } from "../../../api/reference/UserIdentifierInterface";

export interface UserCampaignResponse {
    status: string;
    data: UserCampaignResource;
    count: number;
}

export interface UserCampaignResource {
    user_account_id: string;
    user_agent_ids: Array<string>;
    databag: string;
    user_identifiers: (UserPointIdentifierInfo | UserEmailIdentifierInfo | UserAccountIdentifierInfo | UserAgentIdentifierInfo)[];
}
