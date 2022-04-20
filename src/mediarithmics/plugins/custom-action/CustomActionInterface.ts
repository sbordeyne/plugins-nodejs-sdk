export interface CustomActionRequest {
  user_point_id: string;
  custom_action_id: string;
  datamart_id: string;
  node_id: string;
  scenario_id: string;
}

export interface CustomActionPluginResponse {
  status: "ok" | "ko";
}

export interface CustomAction {
  id: string;
  name: string;
  organisation_id: string;
  group_id: string;
  artifact_id: string;
  creation_ts: number;
  created_by: string;
  version_id: string;
  version_value: string;
}
