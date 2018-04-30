# Plugin SDK

This is the mediarithmics SDK for building plugins in Typescript or raw Node.js easily. As this package includes Typescript interfaces, we recommend that you use it with Typescript to ease your development.

It covers (as of v0.3.0):
- AdRenderer (incl. Templating systems + recommendations)
- Activity Analyzer
- Email Renderer
- Email Router
- Bid Optimizer

Coming soon:
- Recommender

## Installation

This module is installed via npm:

```
npm install --save @mediarithmics/plugins-nodejs-sdk
```
## Concepts

### Overall mechanism

The NodeJS plugin SDK consists of a set of abstract class that you have to implement. Those class provides a lot of helpers to make your life easier when having to make calls to the mediarithmics plugin gateway and/or to retrieve data.

This SDK also integrate a lot of very useful Typescript interfaces that we highly recommend you to use.

In order to implement your own logic while building your plugin, you have to override the "main" processing function of the abstract class in your impementation.

This function to override depend on the Plugin type. Those are:

- onAdContents for AdRenderer plugins
- onActivityAnalysis for Activity Analyzer plugins

If you need a custom Instance Context (see below), you can also override the 'instanceContextBuilder' function of the abstract class.

Once you will have provided your own implementation of the abstract class, you'll have to instantiate it and to give this instance to a 'Runner' that will run it as a web server app.

### Request

A mediarithmics plugin is called by the mediarithmics platform wih a 'Request' that contains all the Data to process / evaluate. Each type of plugin, depending on its functional behavior, is receiving a different request payload.

The plugin SDK contains a typescript interface describing the format of the request for each supported plugin.

A request can be:
- An User activity to process
- An Ad creative to render (e.g. generate HTML/JS)
- An email to render (e.g. generate HTML/raw text)
- A Bid Request to evaluate (e.g. should I bid on it? And at which price?)

Please see the complete documentation for each Plugin Type [here.](https://developer.mediarithmics.com/)

### Instance Context

A plugin instance can have a configuration that will change the way it will process Requests. As a plugin will be called numerous time to process incoming Requests, its configuration must be cached and only refreshed periodically. This SDK is helping you to manage this cache by providing you an "Instance Context" that represents this cache.

A default "Instance Context" is automatically provided by the SDK for each plugin type but you can also provide your own "Instance Context Builder" that will be called periodically to rebuild the cache.

If you need to have a custom *Instance Context* format because you pre-calculate or charge in memory some values (ex: if you need to compile a Template / load in memory a statistic model / etc.), you can:
1. Override the default *Instance Context Builder* function of the Plugin class
2. If you are using Typescript, you can extends the Base Interface of the Instance Context of your plugin that is provided so that you can add your custom fields

Note: The plugin instance configuration can be done through the mediarithmics console UI or directly by API.

### Runners

The SDK provides 2 different runners:
- ProductionPluginRunner: you have to use this runner in your main JS file. This runner is creating a web server to host your plugin so that it can be called by the mediarithmics platform
- TestingPluginRunner: this is a Runner used to write tests for your plugins.

For details on how to use those 2 runners, please refer the examples code snippets provided with the SDK.

## Quickstart - Typescript

### SDK import

You have to import the 'core' module of the SDK in your code to access to the Abstract classes and Typescript interfaces. If you need some external integration, as the "Handlebar" templating system for example, you can also import the 'extra' package.

#### Example import
``` js
import { core } from "@mediarithmics/plugins-nodejs-sdk";
```

### Abstract class implementation

When implementing a plugin class, you need to give him the main 'processing' function that he will process every time a Request is being received.

#### AdRenderer example

``` js
export class MySimpleAdRenderer extends core.AdRendererBasePlugin<
  core.AdRendererBaseInstanceContext
> {
  protected async onAdContents(
    request: core.AdRendererRequest,
    instanceContext: core.AdRendererBaseInstanceContext
  ): Promise<core.AdRendererPluginResponse> {
    .....
  }
}
```

#### Activity Analyzer example

``` js
export class MyActivityAnalyzerPlugin extends core.ActivityAnalyzerPlugin {
  protected onActivityAnalysis(
    request: core.ActivityAnalyzerRequest,
    instanceContext: core.ActivityAnalyzerBaseInstanceContext
  ): Promise<core.ActivityAnalyzerPluginResponse> {
    ......
  }
}
```

### Plugin Runner for production

Once you have implemented your own Plugin class, you have to instantiate it and to provide the instance to a Plugin Runner. For Production use, here is how you need to do it:

#### Activity Analyzer example

``` js
const plugin = new MyActivityAnalyzerPlugin();
const runner = new core.ProductionPluginRunner(plugin);
runner.start();
```
#### AdRenderer example

``` js
const plugin = new MySimpleAdRenderer();
const runner = new core.ProductionPluginRunner(plugin);
runner.start();
```

### Plugin Testing

This SDK provides you a 'TestingPluginRunner' that you can use to mock the transport layer of the plugin (e.g. emulate its call to the platform) and which expose the plugin 'app' on which you can trigger fake calls to test your plugin logic.

The Plugin examples provided with the SDK are all tested and you can read their tests in order to build your own tests.

Testing Plugins is highly recommended.

## Migration from 0.3.x to 0.4.x

* the type `Value` has been removed and replaced by a serie of specialized types. Following this change, `PluginProperty` has been transformed to a discriminated union (see the eponym section at https://www.typescriptlang.org/docs/handbook/advanced-types.html ).

* in `EmailRendererBaseInstanceContext`, `EmailRouterBaseInstanceContext`, `ActivityAnalyzerBaseInstanceContext`, `BidOptimizerBaseInstanceContext`and `AdRendererBaseInstanceContext` the fields `creativeProperties`, `routerProperties`, `activityAnalyzerProperties`, `bidOptimizerProperties` and `displayAdProperties` have been rename `properties` which is now typed as a `PropertiesWrapper`.

* `PropertiesWrapper` is a class with a constructor that takes as parameter an `Array<PluginProperty>`. The `PropertiesWrapper` normalize the array to give an access to these properties by their `technical_name` in O(1).

* `BidOptimizerPluginResponse` has been replaced by `BidDecision`

* `core.ResponseData` and `core.ResponseListOfData` have been respectively renamed `core.DataResponse` and `core.DataListResponse`

* `core.RecommandationsWrapper` have been renamed to `core.RecommendationsWrapper`


## Migration from 0.2.x to 0.3.x

The 0.3.0 release of the Plugin SDK introduces some breaking changes in the AdRenderer support.

The following points changed:

### AdRendererRecoTemplatePlugin Vs. AdRendererTemplatePlugin

In v0.2.x, the Plugin SDK only provided `AdRendererRecoTemplatePlugin` for building AdRenderer based on a Templating Engine.

This base class was forcing developers to handle recommendations while for some use case, you only need the 'Templating' without having to handle the recommendation part.

In v0.3.0, there are now 2 classes to build an AdRenderer:
1. AdRendererTemplatePlugin: if you want to do an AdRenderer without any recommendations but with a Templating engine, this is what you want
2. AdRendererRecoTemplatePlugin: if you want to use recommendations in your AdRenderer while also doing templating, this is what you need 

### getCreative & getCreativeProperties helper

The AdRenderer base class now only have `getDisplayAd(id)` and `getDisplayAdProperties(id)` helper. Those helpers are replacing the previous `getCreative(id)` and `getCreativeProperties(id)` helpers.

`getDisplayAd` returns a `DisplayAd` interface which is a sub-class of Creative that have some additionnal fields, such as `format`.

### Handlebars context

Previously, the Handlebars extension was providing an `HandleBarRootContext` interface (in `extra`) which was being used for all AdRenderers using Handlebars, whether they were using "Recommendations" or simply doing "basic" templating.

In 0.3.0, there are 3 Handlebars contexts:
- URLHandlebarsRootContext: to be used when replacing macros in URLs
- HandlebarsRootContext: to be used when replacing macros in 'simple' templates without recommendations (e.g. when building a Plugin on top of AdRendererTemplatePlugin)
- RecommendationsHandlebarsRootContext: to be used when replacing macros in a template used with "Rrcommendations (e.g. when building a Plugin on top of AdRendererRecoTemplatePlugin)

The Handlebars context themselves also changed. This is in order to build a set of standard macros in all AdRenderer Plugin available on mediarithmics platform => hence, you now have to propose values to be replaced in all the standard macros.

### Handlebars macros

All macros are now in UPPER CASE. Some macros (request, creative, etc.) have to be changed before using them with an ad renderer based on the 0.3.0.

### Handlebar engines

Prior to the v0.3.0, there was only one Handlebars engine provided in the extra package.

With the 0.3.0, there are now 2 Handlebars engine:
- HandlebarsEngine: to be used when building an AdRenderer without recommendations
- RecommendationsHandlebarsEngine: to be used when building a 'recommendation' Ad Renderer