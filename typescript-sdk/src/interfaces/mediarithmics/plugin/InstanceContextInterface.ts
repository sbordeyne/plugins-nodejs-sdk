import { Creative } from "../api/CreativeInterface";
import { CreativeProperty } from "../api/CreativePropertyInterface";

// AdRenderer Instance Contexts
export interface AdRendererBaseInstanceContext {
    creative: Creative;
    creativeProperties: CreativeProperty[];
}

export interface AdRendererHandlebarTemplateInstanceContext {
    creative: Creative;
    creativeProperties: CreativeProperty[];
}