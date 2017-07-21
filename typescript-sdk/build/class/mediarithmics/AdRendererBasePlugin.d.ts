import { AdRendererRequest } from '../../interfaces/mediarithmics/api/AdRendererRequestInterface';
import { Creative } from '../../interfaces/mediarithmics/api/CreativeInterface';
import { CreativeProperty } from '../../interfaces/mediarithmics/api/CreativePropertyInterface';
import { AdRendererBaseInstanceContext } from "../../interfaces/mediarithmics/plugin/InstanceContextInterface";
import { BasePlugin } from './BasePlugin';
export declare class AdRendererBasePlugin extends BasePlugin {
    instanceContext: Promise<AdRendererBaseInstanceContext>;
    fetchCreative(creativeId: string): Promise<Creative>;
    fetchCreativeProperties(creativeId: string): Promise<CreativeProperty[]>;
    getEncodedClickUrl(redirectUrls: string[]): string;
    setInstanceContextBuilder(instanceContextBuilder: (creativeId: string) => Promise<AdRendererBaseInstanceContext>): void;
    private buildInstanceContext;
    private onAdContents;
    private initAdContentsRoute();
    constructor(adContentsHandler: (request: AdRendererRequest, instanceContext: AdRendererBaseInstanceContext) => string);
}
