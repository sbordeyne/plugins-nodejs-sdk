export interface AdRendererRequest {
    call_id: string;
    context: string;
    creative_id: string;
    campaign_id: string;
    ad_group_id: string;
    media_id: string;
    protocol: string;
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
}
