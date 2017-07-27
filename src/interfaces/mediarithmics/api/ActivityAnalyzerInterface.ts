export interface ActivityAnalyzerResponse {
    status: string;
    data: ActivityAnalyzer;
    count: number;
}

export interface ActivityAnalyzer {
    id: string;
    organisation_id: string;
    name: string;
    group_id: string;
    artifact_id: string;
    visit_analyzer_plugin_id: number;
}