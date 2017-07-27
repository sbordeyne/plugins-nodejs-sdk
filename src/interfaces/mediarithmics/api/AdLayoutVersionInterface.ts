export interface AdLayoutVersionResponse {
    data: AdLayoutVersion;
    count: number;
    status: string;
}

export interface AdLayoutVersion {
    id: string;
    version_id: string;
    creation_date: number;
    filename: string;
    template: string;
    ad_layout_id: string;
    status: string;
}