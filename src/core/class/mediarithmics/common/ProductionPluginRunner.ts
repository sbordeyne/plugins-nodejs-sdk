import { BasePlugin } from "./BasePlugin";
import { Server } from "http";
import * as cluster from "cluster";

export class ProductionPluginRunner {
  numCPUs = require("os").cpus().length;

  pluginPort: number = parseInt(process.env.PLUGIN_PORT) || 8080;

  plugin: BasePlugin;
  server: Server;

  constructor(plugin: BasePlugin) {
    this.plugin = plugin;
  }

  // Start a server serving the plugin app
  // A port can be provided to run the server on it
  start(port?: number) {

    if (cluster.isMaster) {
      this.plugin.logger.info(`Master ${process.pid} is running`);

      // Fork workers.
      for (let i = 0; i < this.numCPUs; i++) {
        cluster.fork();
      }

      cluster.on("exit", (worker, code, signal) => {
        this.plugin.logger.info(`worker ${worker.process.pid} died`);
        cluster.fork();
      });

    } else {
      const serverPort = port ? port : this.pluginPort;

      this.server = this.plugin.app.listen(serverPort, () =>
        this.plugin.logger.info("Plugin started, listening at " + serverPort)
      );

      this.plugin.logger.info(`Worker ${process.pid} started`);

    }
  }
}
