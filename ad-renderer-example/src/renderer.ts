"use strict";

import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as logger from 'winston';
import * as _ from 'lodash';
import * as rp from 'request-promise';
import * as Promise from 'bluebird';
import {CreativeResponse} from 'mediarithmics-plugins-typescript-helpers';

const gatewayHost = process.env.GATEWAY_HOST || "plugin-gateway.platform";
const gatewayPort = process.env.GATEWAY_PORT || 8080;
const pluginPort = process.env.PLUGIN_PORT || 8080;

const outboundPlatformUrl = `http://${gatewayHost}:${gatewayPort}`;
const displayContextHeader = "x-mics-display-context";

function request(method: string, uri: string, body ? : any) {

  const options = {
    method: method,
    uri: uri,
    json: true,
    auth: {
      user: worker_id,
      pass: authentication_token,
      sendImmediately: true
    }
  };

  return rp(body ? Object.assign({
    body: body
  }, options) : options).catch(function (e) {
    if (e.name === "StatusCodeError") {
      throw new Error(`Error while calling ${method} '${uri}' with the request body '${body||""}': got a ${e.response.statusCode} ${e.response.statusMessage} with the response body ${JSON.stringify(e.response.body)}`);
    } else {
      throw e;
    }
  });
}

const fetch = {

  creative: (creativeId: string): Promise < CreativeResponse > => request('GET', `${outboundPlatformUrl}/v1/creatives/${creativeId}`),
  creativeProperties: (creativeId: string): Promise < CreativePropertyResponse > => request('GET', `${outboundPlatformUrl}/v1/creatives/${creativeId}/renderer_properties`)

};

logger.transports.Console.level = 'info';

// Global variable used for authentication used for contacting the outbound platform
// provided/updated by the plugin managed call on /v1/init route
let worker_id: string = null;
let authentication_token: string = null;

// local cache
let cache: Map < string, Promise < AdRendererContext >> = new Map();

// caches expiration
setInterval(function () {
  logger.silly("Invalidating cache");
  cache = new Map();
}, 30000);

const app = express();
app.use(bodyParser.json({
  type: '*/*'
}));

//Route used by the plugin manager to check if the plugin is UP and running
app.get('/v1/status', function (req, res) {
  logger.silly('GET /v1/status');
  if (worker_id && authentication_token) {
    res.end();
  } else {
    res.status(503).end();
  }
});

//Route to set the log_level
//See winston doc for level definition
// curl -X PUT -H "Content-Type: application/json" -d '{"level":"debug"}' http://localhost:8080/v1/log_level
app.put('/v1/log_level', function (req, res) {
  if (req.body && req.body.level) {
    logger.info('Setting log level to ' + req.body.level);
    logger.transports.Console.level = req.body.level;
    res.end();
  } else {
    logger.error('Incorrect body : Cannot change log level, actual: ' + logger.level);
    res.status(500).end();
  }
});

app.get('/v1/log_level', function (req, res) {
  res.send({
    level: logger.level
  });
});


// Route called by the plugin manager to provide authentication information to the plugin
// curl -X POST -H "Content-Type: application/json" -d '{"authentication_token":"123", "worker_id":"123"}' http://localhost:8080/v1/init
app.post('/v1/init', function (req, res) {
  logger.debug('POST /v1/init ', req.body);
  authentication_token = req.body.authentication_token;
  worker_id = req.body.worker_id;
  logger.info('Update authentication_token with %s', authentication_token);
  res.end();
});

const getEncodedClickUrl = (redirectUrls: string[]): string => {

  let urls = redirectUrls.slice(0);

  return urls.reduceRight((acc, current) => current + encodeURIComponent(acc), '');
};

function loadInstanceContext(adRenderRequest: AdRendererRequest): Promise < AdRendererContext > {
  logger.info("Loading instance context.");
  return fetch.creative(adRenderRequest.creative_id).then((creative: CreativeResponse): Promise < AdRendererContext > => {
    logger.info("Loaded creative %d => %j", adRenderRequest.creative_id, JSON.stringify(creative));
    return fetch.creativeProperties(adRenderRequest.creative_id).then((creativeProperties: CreativePropertyResponse): AdRendererContext => {
      logger.info("Loaded renderer properties of creative %d => %j", adRenderRequest.creative_id, JSON.stringify(creativeProperties));

      const quantumTagProperty = _.find(creativeProperties.data, p => p.technical_name === 'quantum_tag');
      const additionalPixeltag = _.find(creativeProperties.data, p => p.technical_name === '3rd_party_pixel_tag');

      if (!quantumTagProperty) {
        logger.error('quantum tag is undefined');
        throw new Error("quantum tag is undefined");
      }

      if (!additionalPixeltag) {
        logger.error('3rd_party_pixel_tag property is undefined');
        throw new Error("3rd_party_pixel_tag property is undefined");
      }

      const urls = adRenderRequest.click_urls;

      const result: AdRendererContext = {
        click_urls: urls ? urls : null,
        quantum_tag_property: quantumTagProperty.value.value ? quantumTagProperty.value.value : null,
        additionalPixeltag: additionalPixeltag.value.value ? additionalPixeltag.value.value : null
      }

      return result;
    });
  });
}

app.post('/v1/ad_contents', function (req, res) {
  if (!req.body || _.isEmpty(req.body)) {
    const msg = {
      error: "Missing request body"
    };
    logger.error('POST /v1/ad_contents : %s', msg);
    res.status(500).json(msg);
  } else {

    const adRenderRequest: AdRendererRequest = req.body;

    logger.info('POST /v1/ad_contents ', JSON.stringify(adRenderRequest));

    if (!cache.get(adRenderRequest.creative_id) || adRenderRequest.context === "PREVIEW") {
      cache.set(adRenderRequest.creative_id, loadInstanceContext(adRenderRequest));
    }

    cache.get(adRenderRequest.creative_id).then(instanceContext => {
      logger.debug(`InstanceContext loaded: ${JSON.stringify(instanceContext)}`);

      // We insert the Quantum TAG and the display pixel
      let js = `${instanceContext.quantum_tag_property}
document.write('<div style="display:none;"><img src="${adRenderRequest.display_tracking_url}" /></div>');`;

      if (instanceContext.additionalPixeltag) {
        js = js + `document.write('<div style="display:none;"><img src="${instanceContext.additionalPixeltag}" /></div>');`;
      }

      // Replacing macros
      const isInPreview = (adRenderRequest.context === 'STAGE' || adRenderRequest.context === 'PREVIEW') ? 1 : 0;

      js = js.replace(/{{TAG_ID}}/g, adRenderRequest.call_id.replace('auc:apx:', ''))
      .replace(/{{CLICK_URL}}/g, getEncodedClickUrl(instanceContext.click_urls))
      .replace(/{{CACHE_BUSTER}}/g, Date.now().toString())
      .replace(/{{MEDIA_ID}}/g, adRenderRequest.media_id)
      .replace(/{{IS_PREVIEW}}/g, isInPreview.toString());

      return js;

    }).then(result => {
      return res.status(200).send(result);
    }).catch(reason => {
      logger.error(`Something bad happened : ${reason.message} - ${reason.stack}`);
      res.status(500).send(reason.message + "\n" + reason.stack);
      return Promise.resolve(null);
    });
  }
});

// Start the plugin and listen on port pluginPort
app.listen(pluginPort, () => logger.info('Renderer started, listening at ' + pluginPort));