import { Creative } from "../api/CreativeInterface";
import { CreativeProperty } from "../api/CreativePropertyInterface";
import { ActivityAnalyzer } from "../api/ActivityAnalyzerInterface";
import { ActivityAnalyzerProperty } from "../api/ActivityAnalyzerPropertyInterface";

// AdRenderer Instance Contexts
export interface AdRendererBaseInstanceContext {
    creative: Creative;
    creativeProperties: CreativeProperty[];
}

export interface AdRendererHandlebarTemplateInstanceContext {
    creative: Creative;
    creativeProperties: CreativeProperty[];
}

export interface ActivityAnalyzerBaseInstanceContext {
    activityAnalyzer: ActivityAnalyzer;
    activityAnalyzerProperties: ActivityAnalyzerProperty[];
}