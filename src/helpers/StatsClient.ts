import { StatsD, Tags } from 'hot-shots';
import winston = require('winston');

export enum MetricsType {
	GAUGE = 'gauge',
	INCREMENT = 'increment',
}

export interface InitOptions {
	/**
	 * interval to send stats to datadog in ms (default = 10 minutes)
	 */
	timerInMs?: number;

	/**
	 * An optional logger to send Metrics into logs (in debug mode)
	 */
	logger?: winston.Logger;
}

export interface addOrUpdateMetricsOptions {
	/**
	 * @example
	 * ```
	 * declare your metrics, their types, value and optionals tags.
	 * {metrics: {processed_users: {type: MetricsType.GAUGE, value: 4, tags: {datamart_id: '4521'}}, users_with_mobile_id_count: {type: MetricsType.INCREMENT, value: 1, tags: {datamart_id: '4521'}}}}
	 * {processed_users: 4}
	 */
	metrics: {
		[metricName: string]: MetricOptions;
	};
}

export type MetricsSet = Map<string, MetricOptions>;

export interface MetricOptions {
	type: MetricsType;
	value: number;
	tags?: Tags;
}

/**
 * Send stats to datadog
 */
export class StatsClient {
	private static instance: StatsClient;
	private interval: NodeJS.Timer;
	private metrics: MetricsSet;
	private client: StatsD;
	private logger?: winston.Logger;

	private constructor(timerInMs: number, logger?: winston.Logger) {
		this.metrics = new Map();
		this.logger = logger;
		this.client = new StatsD({
			protocol: 'uds',
		});

		if (!this.interval) {
			this.interval = setInterval(() => this.sendStats(), timerInMs);
		}
	}

	/**
	 * @example
	 * ```
	 * private this.statsClient: StatsClient
	 * constructor() {
	 *   this.statsClient = StatsClient.init();
	 * }
	 * ```
	 */
	static init({ timerInMs = 10 * 60 * 1000, logger }: InitOptions): StatsClient {
		return this.instance || (this.instance = new StatsClient(timerInMs, logger));
	}

	/**
	 * Increment some metrics
	 * @example
	 * ```
	 * this.statClient.addOrUpdateMetrics({metrics: {processed_users: {type: MetricsType.GAUGE, value: 4, tags: {datamart_id: '4521'}}, users_with_mobile_id_count: {type: MetricsType.INCREMENT, value: 1, tags: {datamart_id: '4521'}}}})
	 * this.statClient.addOrUpdateMetrics({metrics: {apiCallsError: {type: MetricsType.GAUGE, value: 10, tags: {statusCode: '500'}}}})
	 * ```
	 */
	public addOrUpdateMetrics({ metrics }: addOrUpdateMetricsOptions): void {
		Object.entries(metrics).forEach(([metricName, options]) => {
			if (this.metrics.has(metricName)) {
				const metricOptions = this.metrics.get(metricName) as MetricOptions;
				this.metrics.set(metricName, {
					type: metricOptions.type,
					value: metricOptions.value + options.value,
					tags: { ...options.tags },
				});
			} else {
				this.metrics.set(metricName, {
					type: options.type,
					value: options.value,
					tags: options.tags,
				});
			}
		});
	}

	private sendStats(): void {
		[...this.metrics.entries()].forEach(([metricName, options]) => {
			if (options.type === MetricsType.GAUGE) {
				this.client.gauge(metricName, options.value, { ...options.tags });
			} else {
				this.client.increment(metricName, options.value, { ...options.tags });
				this.resetIncrementMetric(metricName);
			}
		});
	}

	private resetIncrementMetric(metricName: string) {
		const metricOptions = this.metrics.get(metricName) as MetricOptions;
		this.metrics.set(metricName, {
			type: metricOptions.type,
			value: 0,
			tags: { ...metricOptions.tags },
		});
	}
}
