export interface PluginEmailMeta {
  fromEmail: string;
  fromName: string;
  toEmail: string;
  toName: string;
  replyTo: string;
  subjectLine: string;
}

export type EmailRenderingContext = "LIVE" | "STAGE" | "PREVIEW";

export interface PluginEmailContent {
  html?: string;
  text?: string;
}
