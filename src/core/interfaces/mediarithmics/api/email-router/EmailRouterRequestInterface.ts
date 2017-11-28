import {
  PluginEmailMeta,
  PluginEmailContent,
  EmailRenderingContext,
  UserPointIdentifierInfo,
  UserEmailIdentifierInfo,
  UserAccountIdentifierInfo,
  UserAgentIdentifierInfo
} from "../../../../index";

export interface EmailRoutingRequest {
  email_router_id: string;
  call_id: string;
  context: EmailRenderingContext;
  creative_id: string;
  campaign_id: string;
  datamart_id: string;
  user_identifiers: (UserPointIdentifierInfo | UserEmailIdentifierInfo | UserAccountIdentifierInfo | UserAgentIdentifierInfo)[];
  meta: PluginEmailMeta;
  content: PluginEmailContent;
  data: any;
}

export interface CheckEmailsRequest {
  email_router_id: string;
  user_identifiers: (UserPointIdentifierInfo | UserEmailIdentifierInfo | UserAccountIdentifierInfo | UserAgentIdentifierInfo)[];
}
