import { UserActivity } from "./UserActivityInterface";

export interface ActivityAnalyzerRequest {
    activity_analyzer_id:	string;
datamart_id:	string;
activity: UserActivity;
}