import { UserActivity } from "../../../../index";
import { UserVisitActivity } from "../common/UserActivityInterface";

export interface ActivityAnalyzerRequest {
    activity_analyzer_id: string;
    datamart_id: string;
    activity: UserActivity;
}

export interface VisitAnalyzerRequest extends ActivityAnalyzerRequest {
    activity: UserVisitActivity;
}