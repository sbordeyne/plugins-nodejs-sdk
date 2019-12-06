import {DataResponse} from '../common/Response';

export type AdLayoutVersionResponse  = DataResponse<AdLayoutVersion>;

export interface AdLayoutVersion {
    id: string;
    version_id: string;
    creation_date: number;
    filename: string;
    template: string;
    ad_layout_id: string;
    status: string;
}