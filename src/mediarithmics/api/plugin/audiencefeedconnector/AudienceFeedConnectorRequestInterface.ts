import {UserIdentifierInfo} from '../../reference/UserIdentifierInterface';

export type UpdateType = 'UPSERT' | 'DELETE';

export interface UserSegmentUpdateRequest {
  feed_id: string;
  session_id: string;
  datamart_id: string;
  segment_id: string;
  user_identifiers: UserIdentifierInfo[];
  ts: number;
  operation: UpdateType;
}

export interface ExternalSegmentConnectionRequest {
  feed_id: string;
  datamart_id: string;
  segment_id: string;
}

export interface ExternalSegmentCreationRequest {
  feed_id: string;
  datamart_id: string;
  segment_id: string;
}