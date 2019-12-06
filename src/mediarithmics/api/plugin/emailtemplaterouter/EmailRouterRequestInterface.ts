import {UserAccountIdentifierInfo, UserAgentIdentifierInfo, UserEmailIdentifierInfo, UserPointIdentifierInfo} from '../../reference/UserIdentifierInterface';
import {EmailRenderingContext, PluginEmailContent, PluginEmailMeta} from '../emailtemplaterenderer';

export interface EmailRoutingRequest {
    email_router_id: string;
    call_id: string;
    context: EmailRenderingContext;
    creative_id: string;
    campaign_id: string;
    blast_id: string;
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
