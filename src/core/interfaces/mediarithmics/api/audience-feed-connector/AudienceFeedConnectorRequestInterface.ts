import { UserIdentifierInfo } from "../../../../index";

export type UpdateType = 'UPSERT' | 'DELETE';

export interface UserSegmentUpdateRequest {
  identifiers: UserIdentifierInfo[];
  ts: number;
  feed_id: string;
  session_id: string;
  datamart_id: string;
  segment_id: string;
  type: UpdateType;
}