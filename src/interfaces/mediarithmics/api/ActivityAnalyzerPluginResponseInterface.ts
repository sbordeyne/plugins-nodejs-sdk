import { UserActivity } from "./UserActivityInterface";

export interface ActivityAnalyzerPluginResponse {
  status: string;
  data: UserActivity;
}