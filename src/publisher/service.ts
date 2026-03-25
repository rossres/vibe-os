import { eq, and, gte, lte } from "drizzle-orm";
import { getDb, type Database } from "../core/db/index.js";
import {
	content,
	contentCalendar,
	emailSends,
	emailSuppressions,
} from "../core/db/schema.js";
import type { Channel, DateRange } from "../core/types.js";
import { ok, err, type Result } from "../core/errors.js";

export interface PublishResult {
	contentId: number;
	channel: Channel;
	publishedAt: string;
	externalId?: string;
}

export interface EmailSendReport {
	sent: number;
	bounced: number;
	suppressed: number;
}

export interface CalendarEntry {
	id: number;
	contentId: number | null;
	channel: string;
	scheduledFor: string;
	status: string;
	publishedAt: string | null;
}

export interface PublisherServiceOptions {
	db?: Database;
}

export class PublisherService {
	private db: Database;

	constructor(options?: PublisherServiceOptions) {
		this.db = options?.db ?? getDb();
	}

	async publish(contentId: number, channel: Channel): Promise<Result<PublishResult>> {
		try {
			const rows = await this.db
				.select()
				.from(content)
				.where(eq(content.id, contentId));

			if (rows.length === 0) {
				return err({
					code: "PUBLISHER_CONTENT_NOT_FOUND",
					message: `Content ${contentId} not found`,
					layer: "publisher",
					retryable: false,
				});
			}

			if (channel === "email") {
				// For email channel, delegate to sendEmail with empty recipients
				// (caller should use sendEmail directly for real sends)
				const now = new Date().toISOString();
				await this.db
					.update(content)
					.set({ status: "published", publishedAt: now, updatedAt: now })
					.where(eq(content.id, contentId));

				return ok({
					contentId,
					channel,
					publishedAt: now,
				});
			}

			// For blog channel: placeholder — just update status
			// For all other channels: mark as published
			const now = new Date().toISOString();
			await this.db
				.update(content)
				.set({ status: "published", publishedAt: now, updatedAt: now })
				.where(eq(content.id, contentId));

			return ok({
				contentId,
				channel,
				publishedAt: now,
			});
		} catch (e) {
			return err({
				code: "PUBLISHER_PUBLISH_FAILED",
				message: e instanceof Error ? e.message : "Failed to publish content",
				layer: "publisher",
				retryable: true,
			});
		}
	}

	async schedule(
		contentId: number,
		channel: Channel,
		scheduledFor: Date,
	): Promise<Result<void>> {
		try {
			await this.db.insert(contentCalendar).values({
				contentId,
				channel,
				scheduledFor: scheduledFor.toISOString(),
				status: "scheduled",
			});

			return ok(undefined);
		} catch (e) {
			return err({
				code: "PUBLISHER_SCHEDULE_FAILED",
				message: e instanceof Error ? e.message : "Failed to schedule content",
				layer: "publisher",
				retryable: false,
			});
		}
	}

	async getCalendar(dateRange: DateRange): Promise<CalendarEntry[]> {
		const rows = await this.db
			.select()
			.from(contentCalendar)
			.where(
				and(
					gte(contentCalendar.scheduledFor, dateRange.start.toISOString()),
					lte(contentCalendar.scheduledFor, dateRange.end.toISOString()),
				),
			);

		return rows as CalendarEntry[];
	}

	async sendEmail(
		contentId: number,
		recipients: string[],
	): Promise<Result<EmailSendReport>> {
		try {
			let sent = 0;
			let suppressed = 0;
			const bounced = 0;

			for (const email of recipients) {
				const isSuppressed = await this.isEmailSuppressed(email);
				if (isSuppressed) {
					suppressed++;
					continue;
				}

				// Placeholder for actual Resend API call
				const now = new Date().toISOString();
				await this.db.insert(emailSends).values({
					contentId,
					recipientEmail: email,
					sentAt: now,
				});
				sent++;
			}

			return ok({ sent, bounced, suppressed });
		} catch (e) {
			return err({
				code: "PUBLISHER_EMAIL_FAILED",
				message: e instanceof Error ? e.message : "Failed to send email",
				layer: "publisher",
				retryable: true,
			});
		}
	}

	async addSuppression(
		email: string,
		reason: "unsubscribed" | "bounced",
	): Promise<void> {
		await this.db.insert(emailSuppressions).values({
			email,
			reason,
		});
	}

	async isEmailSuppressed(email: string): Promise<boolean> {
		const rows = await this.db
			.select()
			.from(emailSuppressions)
			.where(eq(emailSuppressions.email, email));

		return rows.length > 0;
	}
}
