import { UserActivity } from "../../../../index";

export interface ActivityAnalyzerRequest {
    activity_analyzer_id: string;
    datamart_id: string;
    activity: UserActivity;
}