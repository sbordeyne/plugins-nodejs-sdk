import * as express from "express";
import * as request from "request";
import * as rp from "request-promise-native";
import * as winston from "winston";
import * as bodyParser from "body-parser";
import { Server } from "http";
import * as cache from "memory-cache";
import * as toobusy from "toobusy-js";
import * as _ from "lodash";

import {SocketMsg, MsgCmd} from "./index";

import {
  PluginProperty,
  PropertyType,
  AssetFileProperty,
  asAssetFileProperty,
  DataFileProperty,
  asDataFileProperty,
  AdLayoutProperty,
  asAdLayoutProperty,
  UrlProperty,
  asUrlProperty,
  StringProperty,
  asStringProperty
} from '../../api/core/plugin/PluginPropertyInterface';

import {Index, Option, flatMap, obfuscateString} from '../../utils';
import {normalizeArray} from '../../utils/Normalizer';
import {DataResponse} from "../../";

export interface InitUpdateResponse {
    status: ResponseStatusCode;
    msg?: string;
}

export interface LogLevelUpdateResponse {
    status: ResponseStatusCode;
    msg?: string;
}

export interface Credentials {
    authentication_token: string;
    worker_id: string;
}

export type ResponseStatusCode = "ok" | "error";

export class PropertiesWrapper {

  readonly normalized: Index<PluginProperty>;

  constructor(readonly values: Array<PluginProperty>) {
      this.normalized = normalizeArray(values, 'technical_name');
  }

  get = (key: string): Option<PluginProperty> => this.normalized[key];

  ofType = (typeName: PropertyType): Option<PluginProperty> =>
      _.find(this.values, p => p.property_type === typeName);

  findAssetFileProperty = (key?: string): Option<AssetFileProperty> => {
      const p = key ? this.get(key) : this.ofType('ASSET');
      return flatMap(p, asAssetFileProperty);
  };

  findDataFileProperty = (key?: string): Option<DataFileProperty> => {
      const p = key ? this.get(key) : this.ofType('DATA_FILE');
      return flatMap(p, asDataFileProperty);
  };

  findUrlProperty = (key?: string): Option<UrlProperty> => {
      const p = key ? this.get(key) : this.ofType('URL');
      return flatMap(p, asUrlProperty);
  };

  findStringProperty = (key?: string): Option<StringProperty> => {
      const p = key ? this.get(key) : this.ofType('STRING');
      return flatMap(p, asStringProperty);
  };

  findAdLayoutProperty = (key?: string): Option<AdLayoutProperty> => {
      const p = key ? this.get(key) : this.ofType('AD_LAYOUT');
      return flatMap(p, asAdLayoutProperty);
  };


}
export abstract class BasePlugin {
  multiThread: boolean = false;

  INSTANCE_CONTEXT_CACHE_EXPIRATION: number = 120000;

  pluginCache: any;

  gatewayHost: string;
  gatewayPort: number;
  outboundPlatformUrl: string;

  app: express.Application;
  logger: winston.LoggerInstance;
  credentials: Credentials;

  _transport: any = rp;

  enableThrottling: boolean = false;// Log level update implementation

  onLogLevelUpdate(level: string) {
    const logLevel = level.toLowerCase();
    this.logger.info("Setting log level to " + logLevel);
    this.logger.level = logLevel;
  }

  // Log level update implementation
  // This method can be overridden by any subclass
  protected onLogLevelUpdateHandler(
    req: express.Request,
    res: express.Response
  ) {
    if (req.body && req.body.level) {
      const level = req.body.level;

      if (this.multiThread) {
        const msg: SocketMsg = {
          value: req.body.level.toLowerCase(),
          cmd: MsgCmd.LOG_LEVEL_UPDATE_FROM_WORKER
        };

        this.logger.debug(
          `Sending DEBUG_LEVEL_UPDATE_FROM_WORKER from worker ${
            process.pid
          } to master with value: ${msg.value}`
        );

        if (typeof process.send === "function") {
          process.send(msg);
        }

        // We have to assume that everything went fine in the propagation...
        res.status(200).end();
      } else {
        // Lowering case

        this.onLogLevelUpdate(level);

        return res.status(200).end();
      }
    } else {
      this.logger.error(
        "Incorrect body : Cannot change log level, actual: " + this.logger.level
      );
      res.status(400).end();
    }
  }

  private initLogLevelUpdateRoute() {
    //Route used by the plugin manager to check if the plugin is UP and running
    this.app.put(
      "/v1/log_level",

      this.asyncMiddleware(
        async (req: express.Request, res: express.Response) => {
          this.onLogLevelUpdateHandler(req, res);
        }
      )
    );
  }

  // Log level update implementation
  // This method can be overridden by any subclass
  protected onLogLevelRequest(req: express.Request, res: express.Response) {
    res.send({ level: this.logger.level.toUpperCase() });
  }

  private initLogLevelGetRoute() {
    this.app.get(
      "/v1/log_level",
      this.asyncMiddleware(
        async (req: express.Request, res: express.Response) => {
          this.onLogLevelRequest(req, res);
        }
      )
    );
  }

  // Health Status implementation
  // This method can be overridden by any subclass
  protected onStatusRequest(req: express.Request, res: express.Response) {
    //Route used by the plugin manager to check if the plugin is UP and running
    this.logger.silly("GET /v1/status");
    if (this.credentials.worker_id && this.credentials.authentication_token) {
      res.status(200).end();
    } else {
      this.logger.error(
        `Plugin is not inialized yet, we don't have any worker_id & authentification_token`
      );
      res.status(503).end();
    }
  }

  private initStatusRoute() {
    this.app.get(
      "/v1/status",
      this.asyncMiddleware(
        async (req: express.Request, res: express.Response) => {
          this.onStatusRequest(req, res);
        }
      )
    );
  }

  fetchDataFile(uri: string): Promise<Buffer> {
    return this.requestGatewayHelper(
      "GET",
      `${this.outboundPlatformUrl}/v1/data_file/data`,
      undefined,
      { uri: uri },
      false,
      true
    );
  }

  fetchConfigurationFile(fileName: string): Promise<Buffer> {
    return this.requestGatewayHelper(
      "GET",
      `${this.outboundPlatformUrl}/v1/configuration/technical_name=${fileName}`,
      undefined,
      undefined,
      false,
      true
    );
  }

  async requestGatewayHelper(
    method: string,
    uri: string,
    body?: any,
    qs?: any,
    isJson?: boolean,
    isBinary?: boolean
  ) : Promise<any> {
    let options: request.OptionsWithUri = {
      method: method,
      uri: uri,
      auth: {
        user: this.credentials.worker_id,
        pass: this.credentials.authentication_token,
        sendImmediately: true
      }
    };

    // Set the body if provided
    options.body = body !== undefined ? body : undefined;

    // Set the querystring if provided
    options.qs = qs !== undefined ? qs : undefined;

    // Set the json flag if provided
    options.json = isJson !== undefined ? isJson : true;

    // Set the encoding to null if it is binary
    options.encoding = isBinary !== undefined && isBinary ? null : undefined;

    this.logger.silly(`Doing gateway call with ${JSON.stringify(options)}`);

    try {
      return await this._transport(options);
    } catch (e) {
      if (e.name === "StatusCodeError") {
        const bodyString =
          isJson !== undefined && !isJson ? body : JSON.stringify(body);
        throw new Error(
          `Error while calling ${method} '${uri}' with the request body '${bodyString ||
          ""}', the qs '${JSON.stringify(qs) || ""}', the auth user '${obfuscateString(options.auth ? options.auth.user : undefined) || ""}', the auth password '${obfuscateString(options.auth ? options.auth.pass : undefined) || ""}': got a ${e.response.statusCode} ${
            e.response.statusMessage
          } with the response body ${JSON.stringify(e.response.body)}`
        );
      } else {
        this.logger.error(
          `Got an issue while doind a Gateway call: ${e.message} - ${e.stack}`
        );
        throw e;
      }
    }
  }

  onInitRequest(creds: Credentials) {
    this.credentials.authentication_token = creds.authentication_token;
    this.credentials.worker_id = creds.worker_id;
    this.logger.info(
      "Update authentication_token with %s",
      this.credentials.authentication_token
    );
  }

  // Plugin Init implementation
  // This method can be overridden by any subclass
  protected onInitRequestHandler(req: express.Request, res: express.Response) {
    if (req.body.authentication_token && req.body.worker_id) {
      const creds: Credentials = {
        authentication_token: req.body.authentication_token,
        worker_id: req.body.worker_id
      };

      // If MultiThread, we send a message to the cluster master,
      // the onInitRequest() will be called once the master will propagate the update to each worker
      if (this.multiThread) {
        const msg: SocketMsg = {
          value: JSON.stringify(creds),
          cmd: MsgCmd.CREDENTIAL_UPDATE_FROM_WORKER
        };

        this.logger.debug(
          `Sending CREDENTIAL_UPDATE_FROM_WORKER from worker ${
            process.pid
          } to master with value: ${msg.value}`
        );

        if (typeof process.send === "function") {
          process.send(msg);
        }

        // We have to assume that everything went fine in the propagation...
        res.status(200).end();

        // Else, we handle the onInitRequest in this process
      } else {
        this.logger.debug("POST /v1/init ", JSON.stringify(creds));

        if (creds && creds.authentication_token && creds.worker_id) {
          this.onInitRequest(creds);
          res.status(200).end();
        } else {
          this.logger.error(`Error while Init: "creds are undefined"`);
          res.status(500).end();
        }
      }
    } else {
      this.logger.error(
        `Received /v1/init call without authentification_token or worker_id`
      );
      res.status(400).end();
    }
  }

  private initInitRoute() {
    this.app.post(
      "/v1/init",
      this.asyncMiddleware(
        async (req: express.Request, res: express.Response) => {
          this.onInitRequestHandler(req, res);
        }
      )
    );
  }

  protected asyncMiddleware = (
    fn: (
      req: express.Request,
      res: express.Response,
      next: express.NextFunction
    ) => any
  ) => (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

  protected setErrorHandler() {
    this.app.use(
      (
        err: any,
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
      ) => {
        this.logger.error(
          `Something bad happened : ${err.message} - ${err.stack}`
        );
        return res.status(500).send(err.message + "\n" + err.stack);
      }
    );
  }

  // Method to start the plugin
  start() {}

  constructor(enableThrottling = false) {

    if(enableThrottling) { this.enableThrottling = enableThrottling }
    const gatewayHost = process.env.GATEWAY_HOST;
    if (gatewayHost) {
      this.gatewayHost = gatewayHost;
    } else {
      this.gatewayHost = "plugin-gateway.platform";
    }

    const gatewayPort = process.env.GATEWAY_PORT;
    if (gatewayPort) {
      this.gatewayPort = parseInt(gatewayPort);
    } else {
      this.gatewayPort = 8080;
    }

    this.outboundPlatformUrl = `http://${this.gatewayHost}:${this.gatewayPort}`;

    this.app = express();

    if (this.enableThrottling) {
      this.app.use((req, res, next) => {
        if (toobusy()) {
          res.status(429).send("I'm busy right now, sorry.");
        } else {
          next();
        }
      });
    }

    this.app.use(bodyParser.json({ type: "*/*", limit: "5mb" }));

    this.logger = new winston.Logger({
      transports: [new winston.transports.Console()],
      level: "info"
    });

    this.pluginCache = cache;
    this.pluginCache.clear();

    this.credentials = {
      authentication_token: "",
      worker_id: ""
    };

    this.initInitRoute();
    this.initStatusRoute();
    this.initLogLevelUpdateRoute();
    this.initLogLevelGetRoute();
  }
}
