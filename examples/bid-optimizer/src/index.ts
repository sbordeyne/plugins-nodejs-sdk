import { core } from "@mediarithmics/plugins-nodejs-sdk";
import { MyBidOptimizerPlugin } from './MyPluginImpl'

// All the magic is here
const plugin = new MyBidOptimizerPlugin();
const runner = new core.ProductionPluginRunner(plugin);
runner.start();