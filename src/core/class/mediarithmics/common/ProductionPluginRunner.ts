import { BasePlugin } from "./BasePlugin";
import { Server } from "http";
import * as cluster from "cluster";

export enum MsgCmd {
  CREDENTIAL_UPDATE_FROM_WORKER,
  CREDENTIAL_UPDATE_FROM_MASTER,
  GET_CREDENTIAL_REQUEST,
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
  masterListener = (recMsg: SocketMsg) => {
    this.plugin.logger.debug(
      `Master is being called with ${JSON.stringify(recMsg)}`
    );

    // If we receive a Token Update, we update the token
    if (recMsg.cmd === MsgCmd.CREDENTIAL_UPDATE_FROM_WORKER) {
      this.plugin.credentials = JSON.parse(recMsg.value);
    }

    // We send the token to each of the workers
    if (
      recMsg.cmd === MsgCmd.CREDENTIAL_UPDATE_FROM_WORKER ||
      recMsg.cmd === MsgCmd.GET_CREDENTIAL_REQUEST
    ) {
      const msg = {
        cmd: MsgCmd.CREDENTIAL_UPDATE_FROM_MASTER,
        value: JSON.stringify(this.plugin.credentials)
      };
      for (const id in cluster.workers) {
        cluster.workers[id].send(msg);
        }  
    }

    // If we receive a Log Level, we update the token
    if (recMsg.cmd === MsgCmd.LOG_LEVEL_UPDATE_FROM_WORKER) {
      this.plugin.logger.level = recMsg.value;
    }

    // We send the log level to each of the workers
    if (
      recMsg.cmd === MsgCmd.LOG_LEVEL_UPDATE_FROM_WORKER ||
      recMsg.cmd === MsgCmd.GET_LOG_LEVEL_REQUEST
    ) {
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
   * Socker Listener of the worker. It should listen for Token update from master and for Log Level changes
   * @param recMsg 
   */
  workerListener = (recMsg: SocketMsg) => {

    this.plugin.logger.debug(
      `Worker is being called with ${JSON.stringify(recMsg)}`
    );

    // If we receive a Token Update, we propagate it to all workers
    if (recMsg.cmd === MsgCmd.CREDENTIAL_UPDATE_FROM_MASTER) {
      this.plugin.credentials = JSON.parse(recMsg.value);

      this.plugin.logger.debug(
        `Updated credentials with: ${JSON.stringify(this.plugin.credentials)}`
      );
    } else if (recMsg.cmd === MsgCmd.LOG_LEVEL_UPDATE_FROM_MASTER) {
      this.plugin.logger.level = recMsg.value.toLocaleLowerCase();

      this.plugin.logger.debug(
        `Updated log level with: ${JSON.stringify(this.plugin.logger.level)}`
      );
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

      // We add a socket Listener to each workers so that Master can listen to them
      for (const id in cluster.workers) {
        this.plugin.logger.info(`Updated listener of Woker: ${id}`);
        cluster.workers[id].on("message", this.masterListener);
      }

      // Sometimes, workers dies
      cluster.on("exit", (worker, code, signal) => {
        this.plugin.logger.info(`worker ${worker.process.pid} died`);

        // We add a new worker, with the proper socket listener
        const newWorker = cluster.fork();
        newWorker.on("message", this.masterListener);
      });
    } else {
      // We pass the Plugin into MT mode
      this.plugin.multiThread = true;

      // We attach a socket listener to get messages from master
      process.on("message", this.workerListener);

      // We ask for a token refresh from Master (in case we are a new Worker just created and that Master already have a token)
      const tokenRefreshRequest: SocketMsg = {
        cmd: MsgCmd.GET_CREDENTIAL_REQUEST
      };
      process.send(tokenRefreshRequest);

      const serverPort = port ? port : this.pluginPort;

      this.server = this.plugin.app.listen(serverPort, () =>
        this.plugin.logger.info("Plugin started, listening at " + serverPort)
      );

      this.plugin.logger.info(`Worker ${process.pid} started`);
    }
  }
}
