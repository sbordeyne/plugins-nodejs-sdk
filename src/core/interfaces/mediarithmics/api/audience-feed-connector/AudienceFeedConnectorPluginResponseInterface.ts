export type AudienceFeedConnectorStatus = 'ok' | 'error';

export interface AudienceFeedConnectorPluginResponse {
    status: AudienceFeedConnectorStatus;
    message?: string;
    nextMsgDelayInMs?: number;
  }