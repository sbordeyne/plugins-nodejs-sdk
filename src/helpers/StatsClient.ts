import { StatsD, Tags } from 'hot-shots';
import winston = require('winston');

export enum PluginType {
	AUDIENCE_FEED = 'audience_feed',
	ACTIVITY_ANALYSER = 'activity_analyser',
	CUSTOM_ACTION = 'custom_action',
	AD_RENDERER = 'ad_renderer',
}

export enum MetricsType {
	GAUGE = 'gauge',
	INCREMENT = 'increment',
}

export interface InitOptions {
	/**
	 * The type of your plugin
	 */
	pluginType: PluginType;
	/**
	 * The id of you plugin depending of the type (feed_id, channel_id, custom_action_id, or ad_renderer_id)
	 */
	id: string;
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

	private constructor(pluginId: { [id: string]: string }, timerInMs: number, logger?: winston.Logger) {
		this.metrics = new Map();
		this.logger = logger;
		this.client = new StatsD({
			protocol: 'uds',
			globalTags: { ...pluginId },
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
	 *   this.statsClient = StatsClient.init({pluginType: PluginType.AUDIENCE_FEED, id: '1234'});
	 * }
	 * ```
	 */
	static init({ pluginType, id, timerInMs = 10 * 60 * 1000, logger }: InitOptions): StatsClient {
		const pluginId = this.setPluginId(pluginType, id);
		return this.instance || (this.instance = new StatsClient(pluginId, timerInMs, logger));
	}

	private static setPluginId(pluginType: PluginType, id: string): { [id: string]: string } {
		switch (pluginType) {
			case PluginType.ACTIVITY_ANALYSER:
				return { channel_id: id };
			case PluginType.AUDIENCE_FEED:
				return { feed_id: id };
			case PluginType.CUSTOM_ACTION:
				return { custom_action_id: id };
			case PluginType.AD_RENDERER:
				return { ad_renderer_id: id };
		}
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
			}
		});
	}
}
