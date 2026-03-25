export interface EngineError {
	code: string;
	message: string;
	layer: string;
	retryable: boolean;
	context?: Record<string, unknown>;
}

export type Result<T> = { ok: true; data: T } | { ok: false; error: EngineError };

export function ok<T>(data: T): Result<T> {
	return { ok: true, data };
}

export function err<T = never>(error: EngineError): Result<T> {
	return { ok: false, error };
}

export function isOk<T>(result: Result<T>): result is { ok: true; data: T } {
	return result.ok;
}

export function isErr<T>(result: Result<T>): result is { ok: false; error: EngineError } {
	return !result.ok;
}

export function unwrap<T>(result: Result<T>): T {
	if (result.ok) return result.data;
	throw new Error(result.error.message);
}
