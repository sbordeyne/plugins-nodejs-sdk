import {
    AudienceFeed,
    PluginProperty
} from "../../../index";

export interface AudienceFeedConnectorBaseInstanceContext {
    feed: AudienceFeed;
    feedProperties: PluginProperty[];
}
