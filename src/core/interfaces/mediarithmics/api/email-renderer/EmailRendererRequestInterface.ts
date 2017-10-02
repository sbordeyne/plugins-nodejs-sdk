import { UserIdentifierInfo, EmailRenderingContext } from "../../../../index";

export interface EmailRenderRequest {
  email_renderer_id: string;
  call_id: string;
  context: EmailRenderingContext;
  creative_id: string;
  campaign_id: string;
  campaign_technical_name?: string;
  user_identifiers: UserIdentifierInfo[];
  user_data_bag: string;
  click_urls: string[];
  email_tracking_url: string;
}