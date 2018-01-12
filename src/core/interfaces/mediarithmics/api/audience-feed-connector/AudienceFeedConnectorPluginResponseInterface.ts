export type AudienceFeedConnectorStatus = 'ok' | 'error';
export declare type AudienceFeedConnectorConnectionStatus = 'ok' | 'error' | 'external_segment_not_ready_yet';

export interface AudienceFeedConnectorPluginResponse {
  status: AudienceFeedConnectorStatus;
  message?: string;
}

export interface ExternalSegmentCreationPluginResponse {
  status: AudienceFeedConnectorStatus;
  message?: string;
}

export interface ExternalSegmentConnectionPluginResponse {
  status: AudienceFeedConnectorConnectionStatus;
  message?: string;
}

export interface UserSegmentUpdatePluginResponse {
  status: AudienceFeedConnectorStatus;
  message?: string;
  nextMsgDelayInMs?: number;
}
