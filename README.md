#### Note about 0.6.0

_Warning:_ We introduced a breaking change about a Typescript Interface definition associated with the `ActivityAnalyzer` support in the `0.7.0.` version of the SDK. This change is fixing a bug that was, in the end, ignoring all the Email hash related processing (User matching, user deduplication, etc.) on mediarithmics platform.

If you are using the Typescript associated types for an `Activity Analyzer`, we recommend you to upgrade to `v0.7.0+` ASAP. The `v0.6.0` was deprecated on NPM repository.

# Plugin SDK

This is the mediarithmics SDK for building plugins in Typescript or raw Node.js easily. As this package includes Typescript interfaces, we recommend that you use it with Typescript to ease your development.

It covers (as of v0.6.0):

- AdRenderer (incl. Templating systems + recommendations)
- Activity Analyzer
- Email Renderer
- Email Router
- Bid Optimizer
- Recommender
- External Audience Feed

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

- `onAdContents` for AdRenderer plugins
- `onActivityAnalysis` for Activity Analyzer plugins

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

If you need to have a custom _Instance Context_ format because you pre-calculate or charge in memory some values (ex: if you need to compile a Template / load in memory a statistic model / etc.), you can:

1. Override the default _Instance Context Builder_ function of the Plugin class
2. If you are using Typescript, you can extends the Base Interface of the Instance Context of your plugin that is provided so that you can add your custom fields

Note: The plugin instance configuration can be done through the mediarithmics console UI or directly by API.

### Runners

The SDK provides 2 different runners:

- `ProductionPluginRunner(plugin: BasePlugin)`: you have to use this runner in your main JS file. This runner is creating a web server to host your plugin so that it can be called by the mediarithmics platform.
- `TestingPluginRunner(plugin: BasePlugin, transport?: RequestPromiseMockup)`: this is a Runner used to write tests for your plugins. You can provide a mockup for RequestPromise as a parameter to help you writing your tests.

For details on how to use those 2 runners, please refer the examples code snippets provided with the SDK.

#### ProductionPluginRunner

After the instantiation of ProductionPluginRunner, you'll need to call `.start(port?: number, multiProcessEnabled?: boolean)` on the instance to start the web server.

- **port**: Tell on which port to start the webserver. When deployed on mediarithmics platform, the plugin need to listen to `8080` (which is the default value). When setuping local tests, it can be useful to change this port.
- **multiProcessEnabled**: When set to `true`, it tell the SDK to spawn as many processes as there are CPUs on the host in order to ultimately dispatch the load on different cores of the Plugin host. Defaults to `false`.

## Quickstart - Typescript

### SDK import

You have to import the 'core' module of the SDK in your code to access to the Abstract classes and Typescript interfaces. If you need some external integration, as the "Handlebar" templating system for example, you can also import the 'extra' package.

#### Example import

```js
import { core } from '@mediarithmics/plugins-nodejs-sdk';
```

### Abstract class implementation

When implementing a plugin class, you need to give him the main 'processing' function that he will process every time a Request is being received.

#### AdRenderer example

```js
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

```js
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

```js
const plugin = new MyActivityAnalyzerPlugin();
const runner = new core.ProductionPluginRunner(plugin);
runner.start();
```

#### AdRenderer example

```js
const plugin = new MySimpleAdRenderer();
const runner = new core.ProductionPluginRunner(plugin);
runner.start();
```

### Plugin Testing

This SDK provides you a 'TestingPluginRunner' that you can use to mock the transport layer of the plugin (e.g. emulate its call to the platform) and which expose the plugin 'app' on which you can trigger fake calls to test your plugin logic.

The Plugin examples provided with the SDK are all tested and you can read their tests in order to build your own tests.

Testing Plugins is highly recommended.

## Migration from 0.8.x to 0.9.x

The init workflow changed, from a `POST /v1/init` call to tokens given in the environment. The **tests** need to be updated:

The previous

```js
request(runner.plugin.app)
  .post('/v1/init')
  .send({...})
  .end((err, res) => { ...
```

is not needed anymore, use the following instead, at the top of your **test** file (replace the values):

```js
process.env.PLUGIN_WORKER_ID = '<previously used worker id>';
process.env.PLUGIN_AUTHENTICATION_TOKEN = '<previously used auth token>';
```

## Migration from 0.6.0 to 0.7.0+

We introduced a non retrocompatible change between 0.6.0 and 0.7.0 SDK version to fix a bug.

The `UserActivity.$email_hash` interface (`EmailHash`) was updated from:

```js
export interface EmailHash {
	hash: string;
	email?: string;
}
```

to

```js
export interface EmailHash {
	$hash: string;
	$email?: string;
}
```

Hence, the fields name were updated; if you were referencing them in your code, you have to refactor it by prepending a `$`.

## Migration from 0.5.x to 0.6.x

- `click_urls` property of `AdRendererRequest` is replaced with `click_urls_info`.

```js
AdRendererBasePlugin.getEncodedClickUrl(redirectUrls: string[])
```

is now

```js
AdRendererBasePlugin.getEncodedClickUrl(clickUrlInfos: ClickUrlInfo[])
```

To push a url in the redirect chain and build an encoded url, for example

```js
if (instanceContext.creative_click_url) {
	adRenderRequest.click_urls.push(instanceContext.creative_click_url);
}

clickUrl = this.getEncodedClickUrl(adRenderRequest.click_urls);
```

should become

```js
if (instanceContext.creative_click_url) {
	adRenderRequest.click_urls_info.push({
		url: instanceContext.creative_click_url,
		redirect_count: 0,
	});
}
clickUrl = this.getEncodedClickUrl(adRenderRequest.click_urls_info);
```

## Migration from 0.4.x to 0.5.x

The 0.5.x release of the Plugin SDK is mainly aiming at simplifying the use of the "Templating" API.

- `engineBuilder` property of `EmailRendererTemplate` and `AdRendererTemplatePlugin` is now declared `abstract` in the SDK and should no longer be instanciated in the Plugin Impl. `constructor` but directly in the class itself.

```js
  constructor(enableThrottling = false) {
    super(enableThrottling);
    this.engineBuilder = new extra.RecommendationsHandlebarsEngine();
  }
```

should become

```js
  engineBuilder = new extra.RecommendationsHandlebarsEngine();

  constructor(enableThrottling = false) {
    super(enableThrottling);
  }
```

- the `EmailRendererTemplate.fetchTemplateContent()` and `AdRendererTemplatePlugin.fetchTemplateContent()` methods have been deleted. They should be replaced by: `BasePlugin.fetchDataFile()` method which is equivalent.

- the `AdRendererTemplatePlugin.fetchTemplateContentProperties()` method have been deleted because it was using the AdLayout mediarithmics API which is being deprecated in favor of DataFile API. If you were using it, you should migrate your template files to a DataFile Plugin property instead of an AdLayout one. `AdRendererBasePlugin.fetchDisplayAdProperties()` will then give you all the details about how to fetch the template content with `BasePlugin.fetchDataFile()`.

- `AdRendererTemplatePlugin.instanceContextBuilder()` method is no longer taking a `template?: string` parameter. The template compilation should now be done in the Plugin Impl. and no longer in the SDK. The returned `AdRendererTemplateInstanceContext` interface have been updated and is no longer containing the `template` and `render_template` properties as well as the SDK is no longer managing this part.

- `instanceContextBuilder()` method of `AdRenderer` & `EmailRenderer` classes now take a `forceReload` parameter. This parameter should be set at `true` for `PREVIEW`/`STAGE` context so that Users can see in real time the output of their changes on the instance properties.

- `AdRendererBasePlugin.fetchDisplayAd`/`AdRendererBasePlugin.fetchDisplayAdProperties` are also taking a `forceReload` boolean parameter. When set to `true`, it will ask to the platform to bypass all caches and give the last known values for the creative / its properties. This should only be used for `PREVIEW`/`STAGE` context (e.g. when `forceReload` parameter passed to the `instanceContextBuilder()` is set at `true`).

## Migration from 0.3.x to 0.4.x

- the type `Value` has been removed and replaced by a serie of specialized types. Following this change, `PluginProperty` has been transformed to a discriminated union (see the eponym section at https://www.typescriptlang.org/docs/handbook/advanced-types.html ).

- in `EmailRendererBaseInstanceContext`, `EmailRouterBaseInstanceContext`, `ActivityAnalyzerBaseInstanceContext`, `BidOptimizerBaseInstanceContext`and `AdRendererBaseInstanceContext` the fields `creativeProperties`, `routerProperties`, `activityAnalyzerProperties`, `bidOptimizerProperties` and `displayAdProperties` have been rename `properties` which is now typed as a `PropertiesWrapper`.

- `PropertiesWrapper` is a class with a constructor that takes as parameter an `Array<PluginProperty>`. The `PropertiesWrapper` normalize the array to give an access to these properties by their `technical_name` in O(1).

- `BidOptimizerPluginResponse` has been replaced by `BidDecision`

- `core.ResponseData` and `core.ResponseListOfData` have been respectively renamed `core.DataResponse` and `core.DataListResponse`

- `core.RecommandationsWrapper` have been renamed to `core.RecommendationsWrapper`

- `core.UserActivityEvent` is now a `type`. If you were using it as a Class (ex: by extending it), you should now use `core.GenericUserActivityEvent` instead.

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

In 0.3.0+, there are 3 Handlebars contexts:

- `URLHandlebarsRootContext`: to be used when replacing macros in URLs
- `HandlebarsRootContext`: to be used when replacing macros in 'simple' templates without recommendations (e.g. when building a Plugin on top of AdRendererTemplatePlugin)
- `RecommendationsHandlebarsRootContext`: to be used when replacing macros in a template used with "Rrcommendations (e.g. when building a Plugin on top of AdRendererRecoTemplatePlugin)

The Handlebars context themselves also changed. This is in order to build a set of standard macros in all AdRenderer Plugin available on mediarithmics platform => hence, you now have to propose values to be replaced in all the standard macros.

### Handlebars macros

All macros are now in UPPER CASE. Some macros (request, creative, etc.) have to be changed before using them with an ad renderer based on the 0.3.0+.

### Handlebar engines

Prior to the v0.3.0, there was only one Handlebars engine provided in the extra package.

With the 0.3.0+, there are now 2 Handlebars engine:

- HandlebarsEngine: to be used when building an AdRenderer without recommendations
- RecommendationsHandlebarsEngine: to be used when building a 'recommendation' Ad Renderer

### StatsClient helper

You can add a StatsClient to your plugins, by importing helpers. Global tags with relevant datas such as artifact_id, build_id or version_id will be added automatically. When initiating the StatsD client, 4 options can be passed:

- mandatory
  - pluginType
  - id (feed_id, channel_id, custom_action_id, or ad_renderer_id)
- optional
  - timerInMs (interval to send stats to datadog in ms (default = 10 minutes))
  - logger

```js
this.statsClient = helpers.StatsClient.init({
	pluginType: PluginType.AUDIENCE_FEED,
	id: '1234',
	logger: this.logger,
});
```

Using StatsD, the StatsClient, can aggregate and send your stats to services such as Datadog. Increment your stats be calling addOrUpdateMetrics method.

```js
this.statsClient.addOrUpdateMetrics({
	metrics: {
		processed_users: { type: MetricsType.GAUGE, value: 4, tags: { datamart_id: '4521' } },
		users_with_mobile_id_count: { type: MetricsType.GAUGE, value: 1, tags: { datamart_id: '4521' } },
	},
});
this.statsClient.addOrUpdateMetrics({
	metrics: {
		processed_users: { type: MetricsType.GAUGE, value: 10, tags: { datamart_id: '4521' } },
	},
});
this.statsClient.addOrUpdateMetrics({ metrics: { apiCallsError: { type: MetricsType.GAUGE, value: 10, tags: { statusCode: '500' } } } });
```
