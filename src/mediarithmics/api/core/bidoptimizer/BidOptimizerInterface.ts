import {ResponseListOfData} from "../common/Response";

export type BidOptimizerResponse = ResponseListOfData<BidOptimizer>;

export interface BidOptimizer {
    id: string;
    organisation_id: string;
    name: string;
    engine_artifact_id: string;
    engine_version_id: string;
    engine_group_id: string;
}