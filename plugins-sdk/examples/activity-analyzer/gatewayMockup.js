"use strict";

var express = require('express');
var bodyParser = require('body-parser');
var logger = require('winston');

logger.level = 'info';

var app = express();
app.use(bodyParser.json({type: '*/*'}));

app.get('/v1/activity_analyzers/:id', function (req, res) {
    res.send(`{
        "status":"ok",
        "data":{
            "id":"1000",
            "name":"my analyzer",
            "organisation_id":"1000",
            "visit_analyzer_plugin_id":"1001",
            "group_id":"com.mediarithmics.visit-analyzer",
            "artifact_id":"default"}
        }`);
});

app.get('/v1/activity_analyzers/:id/properties', function (req, res) {

	res.send(`{
	"count":1,
	"data":
	[
		{
		"id":"2345",
		"technical_name":"analyzer_rules",
		"value":{
			"uri":"mics://data_file/tenants/1060/plugins_conf/activity_analyzer.conf"
				},
		"property_type":"DATA_FILE"
		}
	],
	"status":"ok"
}`);
	//res.sendStatus(500);

});

// Start the plugin and listen on port 8123
app.listen(8123, function () {
  logger.info('Gateway Mockup started, listening at 8123');
});