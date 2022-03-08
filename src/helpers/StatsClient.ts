import { StatsD, Tags } from 'hot-shots';
import winston = require('winston');

export interface AddTagsToScopeOptions {
	scope: string;
	tags: Tags;
}

export enum METRICS_NAME {
	EXTERNAL_API_CALL_SUCCESS = 'external_api_call_success',
	EXTERNAL_API_CALL_ERROR = 'external_api_call_error',
	EXTERNAL_API_CALL_RETRY = 'external_api_call_retry',

	MICS_API_CALL_SUCCESS = 'mics_api_call_success',
	MICS_API_API_CALL_ERROR = 'mics_api_call_error',
	MICS_API_API_CALL_RETRY = 'mics_api_call_retry',

	AUDIENCE_FEED_BATCH_UPSERT = 'audience_feed_batch_upsert',
	AUDIENCE_FEED_BATCH_DELETE = 'audience_feed_batch_delete',

	AD_RENDER_BANNER_GENERATED_DEFAULT = 'ad_render_banner_generated_default',
	AD_RENDER_BANNER_GENERATED_CUSTOM = 'ad_render_banner_generated_custom',

	ACTIVITY_CREATED = 'activity_created',
	ACTIVITY_FAILED_TO_CREATE = 'activity_failed_to_create',
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

export interface IncrementToStatsOptions {
	/**
	 * @example
	 * ```
	 * name of your metrics and its value.
	 * {processed_users: 4}
	 */
	metrics: Metrics;

	/**
	 * the main tag used to filter the metrics in datadog.
	 * Ex: feedId
	 */
	scope?: string;
}

export interface Metrics {
	[key: string]: number;
}

export interface TagsToScope {
	/**
	 * Custom tags retrived later on the plugin instantiation.
	 * Ex: instance context infos.
	 */
	[scope: string]: Tags;
}

interface Stats {
	[keyOrScope: string]: Metrics | number;
}

/**
 * Send stats to datadog
 */
export class StatsClient {
	private static instance: StatsClient;
	private interval: NodeJS.Timer;
	private stats: Stats;
	private client: StatsD;
	private logger?: winston.Logger;
	private tagsToScope: TagsToScope;

	private constructor(timerInMs: number, logger?: winston.Logger) {
		this.stats = {};
		this.logger = logger;
		this.tagsToScope = {};
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
	 * this.statClient.incrementToStats({scope: ctx.feedId, metrics: {processed_users: 4, users_with_mobile_id_count: 3}})
	 * this.statClient.incrementToStats({scope: ctx.creativeId, metrics: {processed_users: 4}})
	 * this.statClient.incrementToStats({metrics: {apiCallsSuccess: 4}})
	 * this.statClient.incrementToStats({metrics: {apiCallsError: 1}})
	 * ```
	 */
	public incrementToStats({ scope, metrics }: IncrementToStatsOptions): void {
		Object.entries(metrics).forEach(([key, value]) => {
			if (scope) {
				if (this.stats[scope] === undefined) {
					this.stats[scope] = {};
				}
				(this.stats[scope] as Metrics)[key] ? ((this.stats[scope] as Metrics)[key] += value) : ((this.stats[scope] as Metrics)[key] = value);
			} else {
				this.stats[key] ? ((this.stats[key] as number) += value) : (this.stats[key] = value);
			}
		});
	}

	/**
	 * @example
	 * ```
	 * privqte this.statsClient: StatsClient
	 * onInitContext() {
	 *   this.statsClient.addTagsToScope({scope: ctx.feedId, tags: {segmentId: '4567', datamartId: '1789'}})
	 * }
	 * ```
	 */
	public addTagsToScope({ scope, tags }: AddTagsToScopeOptions) {
		this.tagsToScope[scope] = tags;
	}

	private sendStats(): void {
		this.logger?.debug(`Metrics stats: ${JSON.stringify(this.stats)}`);
		Object.entries(this.stats).forEach(([keyOrScope, value]) => {
			if (typeof value === 'number') {
				this.client.gauge(keyOrScope, value);
			} else {
				Object.entries(this.stats[keyOrScope]).forEach(([key, value]) => {
					this.client.gauge(key, value, { scope: keyOrScope, ...this.tagsToScope[keyOrScope] });
				});
			}
		});
	}
}
