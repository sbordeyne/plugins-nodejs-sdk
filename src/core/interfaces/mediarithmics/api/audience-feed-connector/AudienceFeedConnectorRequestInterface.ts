import { UserIdentifierInfo } from "../../../../index";

export type UpdateType = 'UPSERT' | 'DELETE';

export interface FeedUpdateRequest {
  identifiers: UserIdentifierInfo[];
  ts: number;
  feedId: string;
  sessionId: string;
  datamartId: string;
  segmentId: string;
  type: UpdateType;
}