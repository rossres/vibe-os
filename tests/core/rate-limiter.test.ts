import { describe, it, expect } from "vitest";
import { RateLimiter } from "../../src/core/rate-limiter.js";

describe("RateLimiter", () => {
	it("executes within rate limit", async () => {
		const limiter = new RateLimiter();
		const result = await limiter.execute("posthog", async () => "success");
		expect(result).toBe("success");
	});

	it("tracks quota usage", async () => {
		const limiter = new RateLimiter();
		await limiter.execute("posthog", async () => "a");
		await limiter.execute("posthog", async () => "b");
		const usage = limiter.getUsage("posthog");
		expect(usage.callsMade).toBe(2);
	});

	it("retries on rate limit error with backoff", async () => {
		const limiter = new RateLimiter({ maxRetries: 2, baseDelayMs: 10 });
		let attempts = 0;
		const result = await limiter.execute("posthog", async () => {
			attempts++;
			if (attempts < 2) {
				const error = new Error("Rate limited");
				(error as any).status = 429;
				throw error;
			}
			return "success";
		});
		expect(result).toBe("success");
		expect(attempts).toBe(2);
	});
});
