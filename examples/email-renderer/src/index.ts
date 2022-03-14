import {core} from '@mediarithmics/plugins-nodejs-sdk';
import {ExampleEmailRenderer} from './ExampleEmailRenderer';

//All the magic is here
const plugin = new ExampleEmailRenderer();
const runner = new core.ProductionPluginRunner(plugin);

runner.start();
