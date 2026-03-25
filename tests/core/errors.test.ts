import { describe, it, expect } from "vitest";
import { ok, err, isOk, isErr, unwrap } from "../../src/core/errors.js";

describe("Result type", () => {
	it("creates an ok result", () => {
		const result = ok("hello");
		expect(isOk(result)).toBe(true);
		expect(isErr(result)).toBe(false);
		expect(unwrap(result)).toBe("hello");
	});

	it("creates an error result", () => {
		const result = err({
			code: "TEST_ERROR",
			message: "something failed",
			layer: "core",
			retryable: false,
		});
		expect(isErr(result)).toBe(true);
		expect(isOk(result)).toBe(false);
	});

	it("unwrap throws on error result", () => {
		const result = err({
			code: "TEST_ERROR",
			message: "something failed",
			layer: "core",
			retryable: false,
		});
		expect(() => unwrap(result)).toThrow("something failed");
	});
});
