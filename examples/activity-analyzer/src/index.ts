import { core } from "@mediarithmics/plugins-nodejs-sdk";
import { MyActivityAnalyzerPlugin } from './MyPluginImpl'

// All the magic is here
const plugin = new MyActivityAnalyzerPlugin(true);
const runner = new core.ProductionPluginRunner(plugin);

runner.start();
