"use strict";

const express = require('express');
const bodyParser = require('body-parser');
const logger = require('winston');

logger.level = 'info';

const app = express();
app.use(bodyParser.json({
  type: '*/*'
}));
app.get('/v1/creatives/:creativeId', function (req, res) {
  var json = `
{
  "status": "ok",
  "data": {
    "type": "DISPLAY_AD",
    "id": "7168",
    "organisation_id": "1126",
    "name": "Toto",
    "technical_name": null,
    "archived": false,
    "editor_version_id": "5",
    "editor_version_value": "1.0.0",
    "editor_group_id": "com.mediarithmics.creative.display",
    "editor_artifact_id": "default-editor",
    "editor_plugin_id": "5",
    "renderer_version_id": "1054",
    "renderer_version_value": "1.0.0",
    "renderer_group_id": "com.mediarithmics.creative.display",
    "renderer_artifact_id": "ad-renderer",
    "renderer_plugin_id": "1041",
    "creation_date": 1492785056278,
    "subtype": "BANNER",
    "format": "300x250",
    "published_version": 1,
    "creative_kit": null,
    "ad_layout": null,
    "locale": null,
    "destination_domain": "estcequecestbientotlapero.fr",
    "audit_status": "NOT_AUDITED",
    "available_user_audit_actions": [
      "START_AUDIT"
    ]
  }
}`;
  res.send(json);
});

app.get('/v1/creatives/:creativeId/renderer_properties', function (req, res) {

  const js_tag = `console.log("PWNED");`;

  var json = `
{
  "status":"ok",
  "data":[
    {
      "technical_name":"js_tag",
      "value":{"value":"${js_tag.replace(/"/g, '\\"')}"},
      "property_type":"STRING",
      "origin":"PLUGIN",
      "writable":true,
      "deletable":false
    },
    {
      "technical_name":"3rd_party_pixel_tag",
      "value":{"value":null},
      "property_type":"STRING",
      "origin":"PLUGIN",
      "writable":true,
      "deletable":false
    },
    {
      "technical_name":"tag_type",
      "value":{"value":"script"},
      "property_type":"STRING",
      "origin":"PLUGIN_STATIC",
      "writable":false,
      "deletable":false
    }],
  "count":3
}`;

  res.send(json);
  
});

// Start the plugin and listen on port 8123
app.listen(8123, function () {
  logger.info('Testing server started, listening at 8123');
});