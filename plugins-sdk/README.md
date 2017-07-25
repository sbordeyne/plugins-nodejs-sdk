# Plugin SDK

This is the mediarithmics SDK for building plugins in Typescript or raw Node.js easily. As this package includes Typescript interfaces, we recommend that you use it with Typescript.

It covers (as of v0.1.0):
- AdRenderer plugin
- Activity Analyzer plugin

Coming soon:
- Email Renderer
- AdRenderer with recommendations and Handlebars support
- Recommender
- Email Routeur
- Bid Optimizer

## Installation

This module is installed via npm:

```
npm install --save @mediarithmics/plugins-sdk
```
## Concepts

### Request

A mediarithmics plugin is called by the mediarithmics platform wih a 'Request' that contains all the Data to process / evaluate. Each type of plugin, depending on its functionnal behavior, is receiving a different request payload.

The plugin SDK contains a typescript interface describing the format of the request for each supported plugin.

A request can be:
- An user activity to process
- An Ad creative to render (e.g. generate HTML/JS)
- An email to render (e.g. generate HTML/raw text)
- A Bid Request to evaluate (e.g. should I bid on it? And at which price?)

Please see the complete documentation [here.](https://developer.mediarithmics.com/)

### Instance Context

A plugin instance can have a configuration that will change the way it will process Requests. As a plugin will be called numerous time to process Requestsbut its configuration is retrieved only once every 30 seconds for performance reasons.

Note: The plugin instance configuration can be done through mediarithmics console or by API.

The *Instance Context* is an object that contains this configuration and is rebuilt every 30 seconds.

The plugin SDK provide a default *Instance Context Builder* function for each type of plugin it supports called by default. This generate a basic *Instance Context* that will be available during the plugin runtime. The interface of this default Instance Context is also provided in the SDK.

If you need to have a custom *Instance Context* format because you can pre-calculate or charge in memory some values (ex: if you need to compile a Template / load in memory a statistic model / etc.), you can:
1. Override the default *Instance Context Builder* function of the Plugin class
2. Extends the Base Interface of the Instance Context of your plugin that is provided 

## Quickstart - Typescript

### SDK import

Firstly, you'll need to import the proper base class for your plugin. Each plugins has to import 3 class:
1. The Plugin class itself that will be instantiated
2. The Plugin request interface that will be sent by the mediarithmics platform to the Plugin
3. The Plugin Instance Context interface that is representing the Plugin properties that will be available to the plugin.

### AdRenderer imports
``` js
import {
    AdRendererBasePlugin,
    AdRendererRequest,
    AdRendererBaseInstanceContext
} from '@mediarithmics/plugins-sdk';
```

