import {
  UserIdentifierInfo,
  PluginEmailMeta,
  PluginEmailContent,
  EmailRenderingContext
} from "../../../../index";

export interface EmailRoutingRequest {
  email_router_id: string;
  call_id: string;
  context: EmailRenderingContext;
  creative_id: string;
  campaign_id: string;
  datamart_id: string;
  user_identifiers: UserIdentifierInfo[];
  meta: PluginEmailMeta;
  content: PluginEmailContent;
  data: any;
}

export interface CheckEmailsRequest {
  email_router_id: string;
  user_identifiers: UserIdentifierInfo[];
}
