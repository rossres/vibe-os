import type { Platform } from "./types.js";

interface QuotaUsage {
	callsMade: number;
	quotaLimit: number;
	windowStart: Date;
}

interface RateLimiterOptions {
	maxRetries?: number;
	baseDelayMs?: number;
}

const DEFAULT_QUOTAS: Partial<Record<Platform, number>> = {
	google_ads: 15000,
	meta: 200,
	linkedin: 100,
	posthog: 10000,
	ga4: 10000,
	google_places: 5000,
	notion: 10000,
	anthropic: 1000,
	resend: 1000,
};

export class RateLimiter {
	private usage = new Map<string, QuotaUsage>();
	private maxRetries: number;
	private baseDelayMs: number;

	constructor(options?: RateLimiterOptions) {
		this.maxRetries = options?.maxRetries ?? 3;
		this.baseDelayMs = options?.baseDelayMs ?? 1000;
	}

	async execute<T>(platform: Platform, operation: () => Promise<T>): Promise<T> {
		this.trackCall(platform);

		let lastError: Error | undefined;
		for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
			try {
				return await operation();
			} catch (error) {
				lastError = error as Error;
				const status = (error as any)?.status ?? (error as any)?.statusCode;
				if (status === 429 && attempt < this.maxRetries) {
					const delay = this.baseDelayMs * 2 ** attempt + Math.random() * 100;
					await new Promise((resolve) => setTimeout(resolve, delay));
					continue;
				}
				throw error;
			}
		}
		throw lastError;
	}

	getUsage(platform: Platform): QuotaUsage {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const existing = this.usage.get(platform);
		if (existing && existing.windowStart.getTime() === today.getTime()) {
			return existing;
		}
		return {
			callsMade: 0,
			quotaLimit: DEFAULT_QUOTAS[platform] ?? 10000,
			windowStart: today,
		};
	}

	private trackCall(platform: Platform): void {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const existing = this.usage.get(platform);
		if (existing && existing.windowStart.getTime() === today.getTime()) {
			existing.callsMade++;
		} else {
			this.usage.set(platform, {
				callsMade: 1,
				quotaLimit: DEFAULT_QUOTAS[platform] ?? 10000,
				windowStart: today,
			});
		}
	}
}
