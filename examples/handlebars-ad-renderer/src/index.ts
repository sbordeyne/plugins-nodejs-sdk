import {core} from '@mediarithmics/plugins-nodejs-sdk';
import {MyHandlebarsAdRenderer} from './MyPluginImpl';

const plugin = new MyHandlebarsAdRenderer();
const runner = new core.ProductionPluginRunner(plugin);

runner.start();
