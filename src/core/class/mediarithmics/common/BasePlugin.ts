import * as express from "express";
import * as request from "request";
import * as rp from "request-promise-native";
import * as winston from "winston";
import * as bodyParser from "body-parser";
import { Server } from "http";
import * as cache from "memory-cache";

// Helper request function

export abstract class BasePlugin {
  INSTANCE_CONTEXT_CACHE_EXPIRATION: number = 30000;

  pluginCache: any;

  gatewayHost: string;
  gatewayPort: number;
  outboundPlatformUrl: string;

  app: express.Application;
  logger: winston.LoggerInstance;
  worker_id: string;
  authentication_token: string;

  _transport: any = rp;

  // Log level update implementation
  // This method can be overridden by any subclass
  protected onLogLevelUpdate(req: express.Request, res: express.Response) {
    if (req.body && req.body.level) {
      // Lowering case
      const logLevel = req.body.level.toLowerCase();

      this.logger.info("Setting log level to " + req.body.level);
      this.logger.level = logLevel;
      res.status(200).end();
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
      (req: express.Request, res: express.Response) => {
        this.onLogLevelUpdate(req, res);
      }
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
      (req: express.Request, res: express.Response) => {
        this.onLogLevelRequest(req, res);
      }
    );
  }

  // Health Status implementation
  // This method can be overridden by any subclass
  protected onStatusRequest(req: express.Request, res: express.Response) {
    //Route used by the plugin manager to check if the plugin is UP and running
    this.logger.silly("GET /v1/status");
    if (this.worker_id && this.authentication_token) {
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
      (req: express.Request, res: express.Response) => {
        this.onStatusRequest(req, res);
      }
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
      `${this.outboundPlatformUrl}/v1/files/technical_name=${fileName}`,
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
  ) {
    let options = {
      method: method,
      uri: uri,
      json: true,
      auth: {
        user: this.worker_id,
        pass: this.authentication_token,
        sendImmediately: true
      }
    };

    // Set the body if provided
    options = body
      ? Object.assign(
          {
            body: body
          },
          options
        )
      : options;

    // Set the querystring if provided
    options = qs
      ? Object.assign(
          {
            qs: qs
          },
          options
        )
      : options;

    // Set the json flag if provided
    options =
      isJson !== undefined
        ? Object.assign(
            {
              json: isJson
            },
            options
          )
        : options;

    // Set the encoding to null if it is binary
    options = isBinary
      ? Object.assign(
          {
            encoding: null
          },
          options
        )
      : options;

    this.logger.silly(`Doing gateway call with ${JSON.stringify(options)}`);

    try {
      return await this._transport(options);
    } catch (e) {
      if (e.name === "StatusCodeError") {
        throw new Error(
          `Error while calling ${method} '${uri}' with the request body '${body ||
            ""}': got a ${e.response.statusCode} ${e.response
            .statusMessage} with the response body ${JSON.stringify(
            e.response.body
          )}`
        );
      } else {
        this.logger.error(
          `Got an issue while doind a Gateway call: ${e.message} - ${e.stack}`
        );
        throw e;
      }
    }
  }

  // Plugin Init implementation
  // This method can be overridden by any subclass
  protected onInitRequest(req: express.Request, res: express.Response) {
    this.logger.debug("POST /v1/init ", req.body);
    if (req.body.authentication_token && req.body.worker_id) {
      this.authentication_token = req.body.authentication_token;
      this.worker_id = req.body.worker_id;
      this.logger.info(
        "Update authentication_token with %s",
        this.authentication_token
      );
      res.status(200).end();
    } else {
      this.logger.error(
        `Received /v1/init call without authentification_token or worker_id`
      );
      res.status(400).end();
    }
  }

  private initInitRoute() {
    this.app.post("/v1/init", (req: express.Request, res: express.Response) => {
      this.onInitRequest(req, res);
    });
  }

  // Method to start the plugin
  start() {}

  constructor() {
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
    this.app.use(bodyParser.json({ type: "*/*" }));
    this.logger = new winston.Logger({
      transports: [new winston.transports.Console()],
      level: "info"
    });

    this.pluginCache = cache;
    this.pluginCache.clear();

    this.initInitRoute();
    this.initStatusRoute();
    this.initLogLevelUpdateRoute();
    this.initLogLevelGetRoute();
  }
}
