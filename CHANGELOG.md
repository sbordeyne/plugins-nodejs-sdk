# Changelog

# 0.3.1 - 2017-12-01

- Improve error handling with async/await
- Fix error message of gateway helper
- Fix the JSON vs non JSON situations
- Add async middleware to stop using try catch in routes
- Add async middleware to all plugin routes
- Remove legacy log
- Update IAS Tag integration


# 0.3.0 - 2017-11-15

- New "Templating" support with AdRendererTemplatePlugin class (for AdRenderer that don't need recommendations)

# 0.2.4 - 2017-10-25

- Add support for email router and email renderer
- Fix User Activity Interface
- Add a MailJet Email router as an implementation example

## 0.2.3 - 2017-09-15

- Updated the UserActivityEventProperty Interface
- Fix some Activity Analyzer tests

## 0.2.2 - 2017-09-14

- Fix user_agent_id interface
- Add testing of User Agent id (case: null & check if correctly passed to recommender)

## 0.2.1 - 2017-09-13

- Added support of the BidOptimizer plugins
- Fix PluginProperty interface
- Added a BidOptimizer example
- Removed package-lock.json from examples for SDK release testing purposes
- Added some Geolocation helpers

## 0.2.0 - 2017-09-11

- Breaking changes in the SDK public API > Now relying on Javascript ES6 Class APIs. Not compatible with the 0.1.x versions of the SDK
- New interfaces for UserActivity / Recommendations objects
- New Plugin type to implement Ad Renderer using Recommendations and Templating features
- Handlebars.js template engine integration
- Testing capbility of plugin built with this SDK. See the examples to see how it works.
- SDK Tests: The SDK itself is now tested, you can run the tests by typing `npm test`
- Doc generation: Use `npm doc` to generate the documentation (using typedoc)

## 0.1.2 - 2017-08-08

- Fix missing value in ValueInterface (=> url)
- Fix log level case issue
- Add fetchDataFile helper (which return binary)
- Add custom InstanceContext builder use in Activity Analyzer example
- Fix error catching issue
- Exposed ActivityAnalyzer & ActivityAnalyzerProperty interfaces

## 0.1.1 - 2017-08-01

- Include the `build/` directory in the published package

## 0.1.0 - 2017-08-01

- Initial release
