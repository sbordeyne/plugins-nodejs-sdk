import { DataResponse } from "../../api/core/common/Response";
import { UserActivity, UserVisitActivity } from "../../index";

export type ActivityAnalyzerResponse = DataResponse<ActivityAnalyzer>;

export interface ActivityAnalyzer {
    id: string;
    organisation_id: string;
    name: string;
    group_id: string;
    artifact_id: string;
    visit_analyzer_plugin_id: number;
}

export interface ActivityAnalyzerRequest {
    activity_analyzer_id: string;
    datamart_id: string;
    activity: UserActivity;
}

export interface VisitAnalyzerRequest extends ActivityAnalyzerRequest {
    activity: UserVisitActivity;
}

export type ActivityAnalyzerPluginResponse = DataResponse<UserActivity>