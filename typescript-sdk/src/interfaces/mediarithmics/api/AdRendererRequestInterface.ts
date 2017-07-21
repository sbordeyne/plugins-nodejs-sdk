export type ContextEnum = 'LIVE' | 'STAGE' | 'PREVIEW';
export type ProtocolEnum = 'http' | 'https';

export interface SspExtension {
    source: string;
    tag_id: string;
}

export interface AdRendererRequest {
    call_id: string;
    context: ContextEnum;
    creative_id: string;
    campaign_id: string;
    ad_group_id: string;
    media_id: string;
    protocol: ProtocolEnum;
    user_agent: string;
    form_factor: string;
    os_family: string;
    browser_family: string;
    placeholder_id: string;
    user_campaign_id: string;
    click_urls: string[];
    display_tracking_url: string;
    latitude: number;
    longitude: number;
    ssp_extension: SspExtension;
}