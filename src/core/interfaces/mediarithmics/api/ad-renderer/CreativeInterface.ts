export interface CreativeResponse {
    status: string;
    data: Creative;
}

export interface Creative {
    type: string;
    id: string;
    organisation_id: string;
    name: string;
    technical_name: string;
    archived: boolean;
    editor_version_id: string;
    editor_version_value: string;
    editor_group_id: string;
    editor_artifact_id: string;
    editor_plugin_id: string;
    renderer_version_id: string;
    renderer_version_value: string;
    renderer_group_id: string;
    renderer_artifact_id: string;
    renderer_plugin_id: string;
    creation_date: number;
    subtype: string;
    format: string;
    published_version: number;
    creative_kit: string;
    ad_layout: string;
    locale: string;
    destination_domain: string;
    audit_status: string;
    available_user_audit_actions: string[];
}