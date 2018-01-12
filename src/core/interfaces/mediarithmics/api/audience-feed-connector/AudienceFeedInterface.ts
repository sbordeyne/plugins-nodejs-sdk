export interface AudienceFeed {
    id: string;
    plugin_id: string;
    organisation_id: string;
    group_id: string;
    artifact_id: string;
    version_id: string;
}

export interface AudienceSegment {
    id: string;
    organisation_id: string;
    name: string;
    short_description: string;
    technical_name: string;
    default_ttl?: number;
    datamart_id: string;
    provider_name: string;
    persisted: boolean;
}