import * as express from "express";
import * as rp from "request-promise-native";
import * as winston from "winston";
import * as bodyParser from "body-parser";

export class BasePlugin {
  pluginPort: number = parseInt(process.env.PLUGIN_PORT) || 8080;

  gatewayHost: string = process.env.GATEWAY_HOST || "plugin-gateway.platform";
  gatewayPort: number = parseInt(process.env.GATEWAY_PORT) || 8080;

  outboundPlatformUrl: string = `http://${this.gatewayHost}:${this
    .gatewayPort}`;

  app: express.Application;
  logger: winston.LoggerInstance;
  worker_id: string;
  authentication_token: string;

  // Log level update implementation
  // This method can be overridden by any subclass
  onLogLevelUpdate(req: express.Request, res: express.Response) {
    if (req.body && req.body.level) {
      this.logger.info("Setting log level to " + req.body.level);
      this.logger.level = req.body.level;
      res.end();
    } else {
      this.logger.error(
        "Incorrect body : Cannot change log level, actual: " + this.logger.level
      );
      res.status(500).end();
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

  private initLogLevelGetRoute() {
    this.app.get("/v1/log_level", function(
      req: express.Request,
      res: express.Response
    ) {
      res.send({
        level: this.logger.level
      });
    });
  }

  // Health Status implementation
  // This method can be overridden by any subclass

  onStatusRequest(req: express.Request, res: express.Response) {
    //Route used by the plugin manager to check if the plugin is UP and running
    this.logger.silly("GET /v1/status");
    if (this.worker_id && this.authentication_token) {
      res.end();
    } else {
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

  // Plugin Init implementation
  // This method can be overridden by any subclass

  onInitRequest(req: express.Request, res: express.Response) {
    this.logger.debug("POST /v1/init ", req.body);
    this.authentication_token = req.body.authentication_token;
    this.worker_id = req.body.worker_id;
    this.logger.info(
      "Update authentication_token with %s",
      this.authentication_token
    );
    res.end();
  }

  initInitRoute() {
    this.app.post("/v1/init", (req: express.Request, res: express.Response) => {
      this.onInitRequest(req, res);
    });
  }

  // Helper request function
  requestGatewayHelper(
    method: string,
    uri: string,
    body?: string,
    qs?: any,
    json?: boolean
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
    options = (json !== undefined)
      ? Object.assign(
          {
            json: json
          },
          options
        )
      : options;

    return rp(options).catch(function(e) {
      if (e.name === "StatusCodeError") {
        throw new Error(
          `Error while calling ${method} '${uri}' with the request body '${body ||
            ""}': got a ${e.response.statusCode} ${e.response
            .statusMessage} with the response body ${JSON.stringify(
            e.response.body
          )}`
        );
      } else {
        throw e;
      }
    });
  }

  fetchDataFile(uri: string): Promise<string> {
    return this.requestGatewayHelper(
      "GET",
      `${this.outboundPlatformUrl}/v1/data_file/data`,
      undefined,
      { uri: uri },
      false
    );
  }

  constructor() {
    this.app = express();
    this.app.use(
      bodyParser.json({
        type: "*/*"
      })
    );
    this.logger = new winston.Logger({
      transports: [new winston.transports.Console()]
    });

    this.initInitRoute();
    this.initStatusRoute();
    this.initLogLevelUpdateRoute();
    this.initLogLevelGetRoute();

    this.app.listen(this.pluginPort, () =>
      this.logger.info("Plugin started, listening at " + this.pluginPort)
    );
  }
}
