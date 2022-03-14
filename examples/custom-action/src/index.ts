import { core } from "@mediarithmics/plugins-nodejs-sdk";
import { MyCustomActionPlugin } from "./MyPluginImpl";

// All the magic is here
const plugin = new MyCustomActionPlugin();
const runner = new core.ProductionPluginRunner(plugin);

runner.start();