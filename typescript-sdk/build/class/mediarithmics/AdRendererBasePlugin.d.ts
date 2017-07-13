/// <reference types="bluebird" />
/// <reference types="express" />
import * as express from 'express';
import * as Promise from 'bluebird';
import * as AdRendererRequest from '../../interfaces/mediarithmics/AdRendererRequestInterface';
import * as Creative from '../../interfaces/mediarithmics/CreativeInterface';
import * as CreativeProperty from '../../interfaces/mediarithmics/CreativePropertyInterface';
import { BasePlugin } from './BasePlugin';
export declare class AdRendererBasePlugin extends BasePlugin {
    creativeCache: Map<string, Promise<Creative.CreativeResponse>>;
    creativePropertiesCache: Map<string, Promise<CreativeProperty.CreativePropertyResponse>>;
    fetchCreative(creativeId: string): Promise<Creative.Creative>;
    fetchCreativeProperties(creativeId: string): Promise<CreativeProperty.CreativeProperty[]>;
    getEncodedClickUrl(redirectUrls: string[]): string;
    addOnAdContentsListener(listener: (request: AdRendererRequest.AdRendererRequest, response: express.Response) => void): void;
    private onAdContents;
    private initAdContentsRoute();
    constructor();
}
