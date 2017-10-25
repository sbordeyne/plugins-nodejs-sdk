import { core } from "@mediarithmics/plugins-nodejs-sdk";

export interface MyInstanceContext extends core.EmailRouterBaseInstanceContext {
    authenticationToken: string;
}