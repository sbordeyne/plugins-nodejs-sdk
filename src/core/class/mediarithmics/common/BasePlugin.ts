import * as express from "express";
import * as request from "request";
import * as rp from "request-promise-native";
import * as winston from "winston";
import * as bodyParser from "body-parser";
import { Server } from "http";
import * as cache from "memory-cache";
import {
  Credentials,
  SocketMsg,
  MsgCmd,
  InitUpdateResponse,
  LogLevelUpdateResponse
} from "../../../index";

export abstract class BasePlugin {
  multiThread: boolean = false;

  INSTANCE_CONTEXT_CACHE_EXPIRATION: number = 120000;

  pluginCache: any;
  gatewayHost: string = process.env.GATEWAY_HOST || "plugin-gateway.platform";
  gatewayPort: number = parseInt(process.env.GATEWAY_PORT) || 8080;

  outboundPlatformUrl: string = `http://${this.gatewayHost}:${this
    .gatewayPort}`;

  app: express.Application;
  logger: winston.LoggerInstance;
  credentials: Credentials;

  _transport: any = rp;

  // Log level update implementation
  // This method can be overridden by any subclass
  onLogLevelUpdate(level: string): LogLevelUpdateResponse {
    // Lowering case
    const logLevel = level.toLowerCase();
    this.logger.info("Setting log level to " + logLevel);
    this.logger.level = logLevel;
    return { status: "ok" };
  }

  private initLogLevelUpdateRoute() {
    //Route used by the plugin manager to check if the plugin is UP and running
    this.app.put(
      "/v1/log_level",
      (req, res, next) => {
        if (req.body && req.body.level) {
          next();
        } else {
          this.logger.error(
            "Incorrect body : Cannot change log level, actual: " +
              this.logger.level
          );
          res.status(400).end();
        }
      },
      (req, res, next) => {
        const level = req.body.level;

        if (this.multiThread) {
          const msg: SocketMsg = {
            value: req.body.level.toLowerCase(),
            cmd: MsgCmd.LOG_LEVEL_UPDATE_FROM_WORKER
          };

          this.logger.debug(
            `Sending DEBUG_LEVEL_UPDATE_FROM_WORKER from worker ${process.pid} to master with value: ${msg.value}`
          );
          process.send(msg);

          // We have to assume that everything went fine in the propagation...
          res.status(200).end();
        } else {
          const result = this.onLogLevelUpdate(level);

          if (result.status === "error") {
            this.logger.error(`Error while LogLevelUpdate: ${result.msg}`);
            res.status(500).end();
          } else {
            res.status(200).end();
          }
        }
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
        user: this.credentials.worker_id,
        pass: this.credentials.authentication_token,
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
  onInitRequest(creds: Credentials): InitUpdateResponse {

    this.logger.debug("POST /v1/init ", JSON.stringify(creds));
    
    if (creds && creds.authentication_token && creds.worker_id) {
      this.credentials.authentication_token = creds.authentication_token;
      this.credentials.worker_id = creds.worker_id;
      this.logger.info(
        "Update authentication_token with %s",
        this.credentials.authentication_token
      );
      return { status: "ok" };
    } else {
      return { status: "error", msg: "creds are undefined" };
    }
  }

  private initInitRoute() {
    this.app.post(
      "/v1/init",
      (req, res, next) => {
        if (req.body.authentication_token && req.body.worker_id) {
          next();
        } else {
          this.logger.error(
            `Received /v1/init call without authentification_token or worker_id`
          );
          res.status(400).end();
        }
      },
      (req, res, next) => {
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
            `Sending CREDENTIAL_UPDATE_FROM_WORKER from worker ${process.pid} to master with value: ${msg.value}`
          );
          process.send(msg);

          // We have to assume that everything went fine in the propagation...
          res.status(200).end();

          // Else, we handle the onInitRequest in this process
        } else {
          const initUpdateResult = this.onInitRequest(creds);

          if (initUpdateResult.status === "error") {
            this.logger.error(`Error while Init: ${initUpdateResult.msg}`);
            res.status(500).end();
          } else {
            res.status(200).end();
          }
        }
      }
    );
  }

  // Method to start the plugin
  start() {}

  constructor() {
    this.app = express();
    this.app.use(bodyParser.json({ type: "*/*", limit: "5mb" }));
    this.logger = new winston.Logger({
      transports: [new winston.transports.Console()],
      level: "debug"
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
