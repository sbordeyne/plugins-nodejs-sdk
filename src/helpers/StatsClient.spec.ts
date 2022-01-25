import { PluginType, StatsClient } from './StatsClient';
import * as sinon from 'sinon';
import { expect } from 'chai';
import * as winston from 'winston';

const delay = (interval: number) => new Promise((resolve) => setTimeout(resolve, interval));

describe('statsClient', () => {
	let statsClient: StatsClient;
	const logger = winston.createLogger({
		format: winston.format.simple(),
		transports: [new winston.transports.Console()],
		level: 'debug',
	});
	logger.silent = true;

	beforeEach(() => {
		statsClient = StatsClient.init({
			timerInMs: 50,
			tags: { pluginName: 'test', pluginType: PluginType.AUDIENCE_FEED },
			logger,
		});
	});

	afterEach(() => {
		// @ts-ignore
		clearInterval(statsClient.interval);
	});

	it('ok', async () => {
		// @ts-ignore
		const spyFn = sinon.spy(statsClient.client, 'gauge');
		statsClient.incrementToStats({ scope: 'test', metrics: { metricTest: 10 } });
		await delay(75);
		expect(spyFn.callCount).to.be.eq(1);
		expect(spyFn.getCall(0).args).to.be.eqls([
			'metricTest',
			10,
			{
				scope: 'test',
			},
		]);

		await delay(50);
		statsClient.incrementToStats({ scope: 'test', metrics: { metricTest: 40 } });
		statsClient.incrementToStats({ metrics: { noScope: 42 } });

		await delay(50);

		expect(spyFn.getCall(2).args).to.be.eqls([
			'metricTest',
			50,
			{
				scope: 'test',
			},
		]);

		expect(spyFn.getCall(3).args).to.be.eqls(['noScope', 42]);

		await delay(100);

		// console.log(
		// 	'------------------',
		// 	spyFn.getCalls().map((c, index) => {
		// 		return {
		// 			args: c.args,
		// 			index,
		// 		};
		// 	}),
		// );
	});
});
