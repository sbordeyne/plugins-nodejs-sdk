import {core} from '@mediarithmics/plugins-nodejs-sdk';
import {MySimpleAdRenderer} from './MyPluginImpl';

//All the magic is here
const plugin = new MySimpleAdRenderer();
const runner = new core.ProductionPluginRunner(plugin);

runner.start();
