import { core } from "@mediarithmics/plugins-nodejs-sdk";
import { MySimpleEmailRouter } from './MyPluginImpl'

//All the magic is here
const plugin = new MySimpleEmailRouter();
const runner = new core.ProductionPluginRunner(plugin);

runner.start();