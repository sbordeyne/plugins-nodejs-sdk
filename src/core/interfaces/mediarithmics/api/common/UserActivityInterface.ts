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

export interface UserActivity {
  $ts?: number;
  $type: UserActivityTypeEnum;
  $session_status: UserActivitySessionStatusEnum;
  $ttl?: number;
  $user_agent_id?: string;
  $user_account_id?: string;
  $email_hash?: string;
  $origin?: UserActivityOrigin;
  $location: UserActivityLocation;
  $events: UserActivityEvent[];
  // An Activity can contain custom fields
  [propsName: string]: any;
}

export interface UserVisitActivity extends UserActivity {
  $session_duration?: number;
  $topics?: Map<string, Map<string, number>>;
  $site_id?: string;
  $app_id?: string;
}

export interface UserActivityOrigin {
  $campaign_id?: string;
  $campaign_name?: string;
  $campaign_technical_name?: string;
  $channel?: string;
  $creative_id?: string;
  $creative_name?: string;
  $creative_technical_name?: string;
  $engagement_content_id?: string;
  $gclid?: string;
  $keywords?: string;
  $log_id?: string;
  $message_id?: string;
  $message_technical_name?: string;
  $referral_path?: string;
  $social_network?: string;
  $source?: string;
  $sub_campaign_id?: number;
  $sub_campaign_technical_name?: string;
  $ts?: number;
  [propsName: string]: any;  
}

export interface UserActivityLocation {
  $source?: LocationSourceEnum;
  $country?: string;
  $region?: string;
  $iso_region?: string;
  $city?: string;
  $iso_city?: string;
  $zip_code?: string;
  $latlon: number[];
  [propsName: string]: any;  
}

export interface UserActivityEvent {
  $ts: number;
  $event_name: string;
  $properties: UserActivityEventProperty;
}

export interface UserActivityEventProperty {
  [propsName: string]: any;
}
