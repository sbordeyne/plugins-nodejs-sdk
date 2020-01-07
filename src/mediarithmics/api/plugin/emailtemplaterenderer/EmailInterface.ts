export interface PluginEmailMeta {
  from_email?: string;
  from_name?: string;
  to_email?: string;
  to_name?: string;
  reply_to?: string;
  subject_line?: string;
}

export type EmailRenderingContext = 'LIVE' | 'STAGE' | 'PREVIEW';

export interface PluginEmailContent {
  html?: string;
  text?: string;
}
