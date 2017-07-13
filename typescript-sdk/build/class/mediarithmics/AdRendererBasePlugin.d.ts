/// <reference types="bluebird" />
import * as Promise from 'Bluebird';
import * as Creative from '../../interfaces/mediarithmics/CreativeInterface';
import * as CreativeProperty from '../../interfaces/mediarithmics/CreativePropertyInterface';
import { BasePlugin } from './BasePlugin';
export declare class AdRendererBasePlugin extends BasePlugin {
    fetchCreative: (creativeId: string) => Promise<Creative.CreativeResponse>;
    fetchCreativeProperties: (creativeId: string) => Promise<CreativeProperty.CreativePropertyResponse>;
    initAdContentsRoute: () => void;
    constructor();
}
