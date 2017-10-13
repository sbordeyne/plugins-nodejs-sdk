import { BasePlugin } from "./BasePlugin";
import { Server } from "http";
import * as cluster from "cluster";
import { Credentials } from "../../../index";

export enum MsgCmd {
  CREDENTIAL_UPDATE_FROM_WORKER,
  CREDENTIAL_UPDATE_FROM_MASTER,
  LOG_LEVEL_UPDATE_FROM_WORKER,
  LOG_LEVEL_UPDATE_FROM_MASTER,
  GET_LOG_LEVEL_REQUEST
}

export interface SocketMsg {
  cmd: MsgCmd;
  value?: string;
}

export class ProductionPluginRunner {
  numCPUs = require("os").cpus().length;

  pluginPort: number = parseInt(process.env.PLUGIN_PORT) || 8080;

  plugin: BasePlugin;
  server: Server;

  /**
   * Socker Listener for master process. It has 4 jobs:
   * 1 - If a new token is detected by a Worker, it receives a message and should send a message to each workers
   * 2 - If a worker is asking for a token update (ex: the worker was just created because one of his friends died), the master should send a message to each workers
   * 3 - If a log level change is detected by a worker, it receives a message and should send a message to each workers
   * 4 - If a worker is asking for a log level update (ex: the worker was just created because one of his friends died), the master should send a message to each workers
   * @param recMsg 
   */
  masterListener = (worker: cluster.Worker, recMsg: SocketMsg) => {
    this.plugin.logger.debug(
      `Master ${process.pid} is being called with cmd: ${MsgCmd[
        recMsg.cmd
      ]}, value: ${recMsg.value}`
    );

    // If we receive a Token Update, we update the token
    if (recMsg.cmd === MsgCmd.CREDENTIAL_UPDATE_FROM_WORKER) {
      this.plugin.credentials = JSON.parse(recMsg.value);
    }

    // We send the token to each of the workers
    if (recMsg.cmd === MsgCmd.CREDENTIAL_UPDATE_FROM_WORKER) {
      if (
        this.plugin.credentials &&
        this.plugin.credentials.authentication_token &&
        this.plugin.credentials.worker_id
      ) {
        const msg = {
          cmd: MsgCmd.CREDENTIAL_UPDATE_FROM_MASTER,
          value: JSON.stringify(this.plugin.credentials)
        };
        for (const id in cluster.workers) {
          cluster.workers[id].send(msg);
        }
      }
    }

    // If we receive a Log Level, we update the token
    if (recMsg.cmd === MsgCmd.LOG_LEVEL_UPDATE_FROM_WORKER) {
      this.plugin.logger.level = recMsg.value;
    }

    // We send the log level to each of the workers
    if (recMsg.cmd === MsgCmd.LOG_LEVEL_UPDATE_FROM_WORKER) {
      const msg = {
        cmd: MsgCmd.LOG_LEVEL_UPDATE_FROM_MASTER,
        value: this.plugin.logger.level
      };

      for (const id in cluster.workers) {
        cluster.workers[id].send(msg);
      }
    }
  };

  /**
   * Socker Listener of the workers. It should listen for Token update from master and for Log Level changes
   * @param recMsg 
   */
  workerListener = (recMsg: SocketMsg) => {
    this.plugin.logger.debug(
      `Worker ${process.pid} is being called with cmd: ${MsgCmd[
        recMsg.cmd
      ]}, value: ${recMsg.value}`
    );

    // If we receive a Token Update, we propagate it to all workers
    if (recMsg.cmd === MsgCmd.CREDENTIAL_UPDATE_FROM_MASTER) {
      const creds: Credentials = JSON.parse(recMsg.value);

      const initUpdateResult = this.plugin.onInitRequest(creds);

      if (initUpdateResult.status === "error") {
        this.plugin.logger.error(
          `${process.pid}: Error while Init: ${initUpdateResult.msg}`
        );
      } else {
        this.plugin.logger.debug(
          `Updated credentials with: ${JSON.stringify(this.plugin.credentials)}`
        );
      }
    } else if (recMsg.cmd === MsgCmd.LOG_LEVEL_UPDATE_FROM_MASTER) {
      const level = recMsg.value.toLocaleLowerCase();

      const logLevelUpdateResult = this.plugin.onLogLevelUpdate(level);

      if (logLevelUpdateResult.status === "error") {
        this.plugin.logger.error(
          `${process.pid}: Error while updateting LogLevel: ${logLevelUpdateResult.msg}`
        );
      } else {
        this.plugin.logger.debug(
          `${process.pid}: Updated log level with: ${JSON.stringify(
            this.plugin.logger.level
          )}`
        );
      }
    }
  };

  constructor(plugin: BasePlugin) {
    this.plugin = plugin;
  }

  /**
 * Multi threading launch of the App, with socket communicaton to propagate token updates
 * @param port 
 */
  start(port?: number) {
    if (cluster.isMaster) {
      this.plugin.logger.info(`Master ${process.pid} is running`);

      // Fork workers.
      for (let i = 0; i < this.numCPUs; i++) {
        cluster.fork();
      }

      // Listener for when the Cluster is being called by a worker
      cluster.on("message", this.masterListener);

      // Sometimes, workers dies
      cluster.on("exit", (worker, code, signal) => {
        this.plugin.logger.info(`worker ${worker.process.pid} died`);

        // We add a new worker, with the proper socket listener
        const newWorker = cluster.fork();
      });
    } else {
      // We pass the Plugin into MT mode
      this.plugin.multiThread = true;

      // We attach a socket listener to get messages from master
      process.on("message", this.workerListener);

      const serverPort = port ? port : this.pluginPort;

      this.server = this.plugin.app.listen(serverPort, () =>
        this.plugin.logger.info(
          `${process.pid} Plugin started, listening at ${serverPort}`
        )
      );

      this.plugin.logger.info(`Worker ${process.pid} started`);
    }
  }
}
