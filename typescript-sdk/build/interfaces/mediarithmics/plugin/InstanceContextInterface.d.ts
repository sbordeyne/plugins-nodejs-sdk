import { Creative } from "../api/CreativeInterface";
import { CreativeProperty } from "../api/CreativePropertyInterface";
export interface AdRendererBaseInstanceContext {
    creative: Creative;
    creativeProperties: CreativeProperty[];
}
export interface AdRendererHandlebarTemplateInstanceContext {
    creative: Creative;
    creativeProperties: CreativeProperty[];
}
