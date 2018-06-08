import {Customizable} from "../core/common/Customizable";
import {Index} from "../../utils";

export type UserActivityTypeEnum =
    | "SITE_VISIT"
    | "APP_VISIT"
    | "TOUCH"
    | "EMAIL"
    | "DISPLAY_AD"
    | "RECOMMENDER";
export type UserActivitySessionStatusEnum =
    | "NO_SESSION"
    | "IN_SESSION"
    | "CLOSED_SESSION"
    | "SESSION_SNAPSHOT";
export type LocationSourceEnum = 'GPS' | 'IP' | 'OTHER';

export interface EmailHash {
    hash: string;
    email?: string;
}

export interface UserActivity
    extends Customizable{

    $ts?: number;
    $type: UserActivityTypeEnum;
    $session_status: UserActivitySessionStatusEnum;
    $ttl?: number;
    $user_agent_id?: string;
    $user_account_id?: string;
    $compartment_id?: number;
    $email_hash?: EmailHash;
    $origin?: UserActivityOrigin;
    $location?: UserActivityLocation;
    $events: UserActivityEvent[];
}

export interface UserVisitActivity extends UserActivity {
    $session_duration?: number;
    $topics?: Map<string, Map<string, number>>;
    $site_id?: string;
    $app_id?: string;
}

export interface UserActivityOrigin
    extends Customizable{

    $campaign_id?: number;
    $campaign_name?: string;
    $channel?: string;
    $creative_id?: number;
    $creative_name?: string;
    $engagement_content_id?: string;
    $gclid?: string;
    $keywords?: string;
    $log_id?: string;
    $message_id?: number;
    $message_technical_name?: string;
    $referral_path?: string;
    $social_network?: string;
    $source?: string;
    $sub_campaign_id?: number;
    $sub_campaign_technical_name?: string;
    $ts?: number;
}

export interface UserActivityLocation
    extends Customizable{

    $source?: LocationSourceEnum;
    $country?: string;
    $region?: string;
    $iso_region?: string;
    $city?: string;
    $iso_city?: string;
    $zip_code?: string;
    $latlon: number[];

}


export interface UserActivityEventProperty extends Customizable {
}

export interface CampaignTrackingProperties
    extends Customizable {

    $campaign_technical_name?: string;
    $sub_campaign_technical_name?: string;
    $message_technical_name?: string;
    $creative_technical_name?: string;
    $campaign_id?: number;
    $sub_campaign_id?: number;
    $message_id?: number;
    $creative_id?: number;
}

export interface ConversionProperties
    extends Customizable {

    $conversion_id?: string;
    $goal_id?: number;
    //@Deprecated
    $conversion_technical_id?: string;
    //@Deprecated
    $goal_technical_id?: string;
    $conversion_value?: number;
    $log_id?: string;
    $conversion_external_id?: string;
    $goal_technical_name?: string;
}

export type EventName =
    '$ad_click'
    | '$ad_view'
    | '$conversion'
    | '$category_view'
    | '$page_view'
    | '$home_view'
    | '$item_view'
    | '$item_list_view'
    | '$product_view'
    | '$product_list_view'
    | '$basket_view'
    | '$transaction_confirmed'
    | '$email_view'
    | '$email_click'
    | '$email_sent'
    | '$email_delivered'
    | '$email_soft_bounce'
    | '$email_hard_bounce'
    | '$email_unsubscribe'
    | '$email_complaint'
    | '$set_user_profile_properties'
    | '$content_corrections'
    | string
    ;


export type UserActivityEvent =
    AdClickEvent
    | AdViewEvent
    | ConversionEvent
    | GenericUserActivityEvent
    ;

export interface AdClickEvent {
    $ts: number;
    $event_name: '$ad_click';
    $properties: CampaignTrackingProperties
}

export interface AdViewEvent {
    $ts: number;
    $event_name: '$ad_view';
    $properties: CampaignTrackingProperties
}

export interface ConversionEvent {
    $ts: number;
    $event_name: '$conversion';
    $properties: ConversionProperties
}

export interface GenericUserActivityEvent {
    $ts: number;
    $event_name: EventName;
    $properties: Index<any>
}

