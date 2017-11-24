export type AudienceFeedConnectorStatus = 'ok' | 'error';

export interface AudienceFeedConnectorPluginResponse {
  status: AudienceFeedConnectorStatus;
  message?: string;
}

export interface ExternalSegmentCreationPluginResponse {
  status: AudienceFeedConnectorStatus;
  message?: string;
}

export interface ExternalSegmentConnectionPluginResponse {
  status: AudienceFeedConnectorStatus;
  message?: string;
}

export interface UserSegmentUpdatePluginResponse {
  status: AudienceFeedConnectorStatus;
  message?: string;
  nextMsgDelayInMs?: number;
}
