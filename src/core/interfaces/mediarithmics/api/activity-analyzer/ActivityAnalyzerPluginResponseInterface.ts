import { UserActivity } from "../../../../index";

export interface ActivityAnalyzerPluginResponse {
  status: string;
  data: UserActivity;
}