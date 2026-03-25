import { Resend } from "resend";
import { eq, sql } from "drizzle-orm";
import { getDb, type Database } from "../core/db/index.js";
import {
	emailSends,
	emailSuppressions,
	outreachEvents,
} from "../core/db/schema.js";
import { ok, err, type Result } from "../core/errors.js";

export interface EmailSendInput {
	to: string;
	subject: string;
	html: string;
	accountId: number;
	contactId?: number;
	contentId?: number;
	experimentId?: string;
	variantId?: string;
	messageHash?: string;
}

export interface EmailSendResult {
	resendId: string;
	to: string;
	sentAt: string;
}

export interface EmailChannelOptions {
	db?: Database;
	apiKey?: string;
	fromEmail?: string;
	fromName?: string;
}

export class EmailChannel {
	private db: Database;
	private resend: Resend;
	private fromEmail: string;
	private fromName: string;

	constructor(options?: EmailChannelOptions) {
		this.db = options?.db ?? getDb();
		const apiKey = options?.apiKey ?? process.env.RESEND_API_KEY ?? "";
		// Resend SDK throws if key is empty — use a dummy key for unconfigured state
		this.resend = new Resend(apiKey || "re_placeholder_not_configured");
		this.fromEmail =
			options?.fromEmail ?? process.env.RESEND_FROM_EMAIL ?? "hello@example.com";
		this.fromName =
			options?.fromName ?? process.env.RESEND_FROM_NAME ?? "Vibe OS";
		this._apiKey = apiKey;
	}

	private _apiKey: string;

	get isConfigured(): boolean {
		return this._apiKey.length > 0 && this.fromEmail.length > 0;
	}

	async send(input: EmailSendInput): Promise<Result<EmailSendResult>> {
		// Check suppression list
		const suppressed = await this.db
			.select({ id: emailSuppressions.id })
			.from(emailSuppressions)
			.where(eq(emailSuppressions.email, input.to))
			.limit(1);

		if (suppressed.length > 0) {
			return err({
				code: "EMAIL_SUPPRESSED",
				message: `Email ${input.to} is on suppression list`,
				layer: "channels",
				retryable: false,
			});
		}

		try {
			const { data, error } = await this.resend.emails.send({
				from: `${this.fromName} <${this.fromEmail}>`,
				to: [input.to],
				subject: input.subject,
				html: input.html,
			});

			if (error) {
				return err({
					code: "EMAIL_SEND_FAILED",
					message: error.message,
					layer: "channels",
					retryable: true,
				});
			}

			const now = new Date().toISOString();

			// Record in emailSends
			await this.db.insert(emailSends).values({
				contentId: input.contentId ?? null,
				recipientEmail: input.to,
				sentAt: now,
			});

			// Record in outreachEvents for dedupe tracking
			await this.db.insert(outreachEvents).values({
				id: crypto.randomUUID(),
				accountId: input.accountId,
				contactId: input.contactId ?? null,
				channel: "email",
				templateId: input.contentId ? String(input.contentId) : null,
				experimentId: input.experimentId ?? null,
				variantId: input.variantId ?? null,
				messageHash: input.messageHash ?? null,
				deliveryStatus: "sent",
				outcome: null,
				sentAt: now,
			});

			return ok({
				resendId: data?.id ?? "unknown",
				to: input.to,
				sentAt: now,
			});
		} catch (e) {
			return err({
				code: "EMAIL_SEND_ERROR",
				message: e instanceof Error ? e.message : "Unknown email send error",
				layer: "channels",
				retryable: true,
			});
		}
	}

	async sendBatch(
		inputs: EmailSendInput[],
		dailyLimit: number,
	): Promise<{ sent: number; suppressed: number; failed: number }> {
		let sent = 0;
		let suppressed = 0;
		let failed = 0;

		for (const input of inputs) {
			if (sent >= dailyLimit) break;

			const result = await this.send(input);
			if (result.ok) {
				sent++;
			} else if (result.error.code === "EMAIL_SUPPRESSED") {
				suppressed++;
			} else {
				failed++;
			}

			// Small delay to respect rate limits
			if (sent % 10 === 0) {
				await new Promise((r) => setTimeout(r, 100));
			}
		}

		return { sent, suppressed, failed };
	}

	async addSuppression(
		email: string,
		reason: "unsubscribed" | "bounced",
	): Promise<void> {
		await this.db.insert(emailSuppressions).values({ email, reason });
	}
}
