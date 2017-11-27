export type UserIdentifierInfoType = 'USER_POINT' | 'USER_ACCOUNT' | 'USER_EMAIL' | 'USER_AGENT';

export type UUID = string;

export type VectorId = string;
export type TimeStamp = number; //long
export type UserEmailIdentifierProviderResource = any; //TODO
export type UserAgentInfo = any; //TODO

export interface UserIdentifierInfo {
    type: UserIdentifierInfoType;
}

export interface UserPointIdentifierInfo extends UserIdentifierInfo {
    user_point_id: UUID;
}

export interface UserEmailIdentifierInfo extends UserIdentifierInfo {
    hash: string;
    email?: string;
    operator?: string;
    creation_ts: TimeStamp;
    last_activity_ts: TimeStamp;
    providers: Array<UserEmailIdentifierProviderResource>;
}

export interface UserAccountIdentifierInfo extends UserIdentifierInfo {
    user_account_id: string;
    creation_ts: TimeStamp;
}

export interface UserAgentIdentifierInfo extends UserIdentifierInfo {
    vector_id: VectorId;
    device?: UserAgentInfo;
    creation_ts: TimeStamp;
    last_activity_ts: TimeStamp;
    providers: Array<UserAgentIdentifierProviderResource>;
    mappings: Array<UserAgentIdMappingResource>;
}

export interface UserAgentIdMappingResource {
    user_agent_id: string;
    realm_name: string;
    last_activity_ts: number;
}

export interface UserAgentIdentifierProviderResource {
    technical_name: string;
    creation_ts?: TimeStamp;
    last_activity_ts?: TimeStamp;
    expiration_ts?: TimeStamp;
}