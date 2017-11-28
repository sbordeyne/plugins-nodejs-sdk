import { UserPointIdentifierInfo, UserEmailIdentifierInfo, UserAccountIdentifierInfo, UserAgentIdentifierInfo } from "../../../../index";

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
