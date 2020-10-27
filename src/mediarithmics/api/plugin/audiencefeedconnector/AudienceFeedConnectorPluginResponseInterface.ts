export type AudienceFeedConnectorStatus = 'ok' | 'error';
export declare type AudienceFeedConnectorConnectionStatus = 'ok' | 'error' | 'external_segment_not_ready_yet';

export interface AudienceFeedConnectorPluginResponse {
  status: AudienceFeedConnectorStatus;
  data?: UserSegmentUpdatePluginResponseData[];
  stats?: UserSegmentUpdatePluginResponseStats[];
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
  data?: UserSegmentUpdatePluginResponseData[];
  stats?: UserSegmentUpdatePluginResponseStats[];
  message?: string;
  nextMsgDelayInMs?: number;
}

export interface UserSegmentUpdatePluginResponseData {
  destination_token?: string;
  grouping_key?: string
  content?: string;
  binary_content?: BinaryType;
}

export interface UserSegmentUpdatePluginResponseStats {
  identifier?: string;
  sync_result?: string;
  tags?: any
}