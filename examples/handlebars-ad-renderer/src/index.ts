import { core, extra } from "@mediarithmics/plugins-nodejs-sdk";
import * as _ from "lodash";
import { MyHandlebarsAdRenderer } from './MyPluginImpl'

const plugin = new MyHandlebarsAdRenderer();
const runner = new core.ProductionPluginRunner(plugin);

runner.start();
