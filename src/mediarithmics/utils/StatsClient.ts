import { StatsD, Tags } from 'hot-shots';

export enum PluginType {
	ACTIVITY_ANALYZER = 'activity_analyzer',
	AD_RENDER = 'ad_render',
	AUDIENCE_FEED = 'audience_feed',
	BID_OPTIMIZER = 'bid_optimizer',
	CUSTOM_ACTION = 'custom_action',
	EMAIL_RENDERER = 'email_renderer',
	EMAIL_ROUTER = 'email_router',
	RECOMMENDER = 'recommender',
}

export enum METRICS_NAME {
	API_CALL_SUCCESS = 'api_call_success',
	API_CALL_ERROR = 'api_call_error',
	API_CALL_RETRY = 'api_call_retry',

	AUDIENCE_FEED_UPSERT = 'audience_feed_upsert',
	AUDIENCE_FEED_DELETE = 'audience_feed_delete',

	AD_RENDER_BANNER_GENERATED_DEFAULT = 'ad_render_banner_generated_default',
	AD_RENDER_BANNER_GENERATED_CUSTOM = 'ad_render_banner_generated_custom',

	ACTIVITY_ANALYZER = 'activity_analyzer',
}

export interface InitOptions {
	/**
	 * interval to send stats to datadog in ms (default = 10 minutes)
	 */
	timerInMs?: number;

	/**
	 * default plugins tags
	 */
	tags: Tags & { pluginType: PluginType; pluginName: string };
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

export interface Stats {
	[keyOrScope: string]: Metrics | number;
}

/**
 * Send stats to datadog
 */
export default class StatsClient {
	private static instance: StatsClient;
	private interval: NodeJS.Timer;
	private stats: Stats;
	private client: StatsD;
	private tagsToScope: TagsToScope;

	private constructor(timerInMs: number, tags: Tags) {
		this.stats = {};
		this.tagsToScope = {};
		this.client = new StatsD({
			globalTags: {
				workerId: process.env.PLUGIN_WORKER_ID || 'DEFAULT_PLUGIN_ID',
				...tags,
			},
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
	 *   this.statsClient = StatsClient.init({ tags: { pluginType: PluginType.AUDIENCE_FEED, pluginName: 'MySuperPlugInName', segmentId: '1214'} });
	 * }
	 * ```
	 */
	static init({ timerInMs = 10 * 60 * 1000, tags }: InitOptions): StatsClient {
		return this.instance || (this.instance = new StatsClient(timerInMs, tags));
	}

	/**
	 * Increment some metrics
	 * @example
	 * ```
	 * this.statClient.incrementToStats({scope: ctx.feedId, metrics: {processed_users: 4, users_with_mobile_id_count: 3}})
	 * this.statClient.addToStats({scope: ctx.creativeId, metrics: {processed_users: 4}})
	 * this.statClient.addToStats({metrics: {apiCallsSuccess: 4}})
	 * this.statClient.addToStats({metrics: {apiCallsError: 1}})
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
	 *   this.statsClient.addTagsToScope(scope: ctx.feedId, {segmentId: '4567', datamartId: '1789'})
	 * }
	 * ```
	 */
	public addTagsToScope(scope: string, tags: Tags) {
		this.tagsToScope[scope] = tags;
	}

	private sendStats(): void {
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
