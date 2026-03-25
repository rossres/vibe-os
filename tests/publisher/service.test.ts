import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { eq, like } from "drizzle-orm";
import { getDb } from "../../src/core/db/index.js";
import {
	content,
	contentCalendar,
	emailSends,
	emailSuppressions,
} from "../../src/core/db/schema.js";
import { PublisherService } from "../../src/publisher/service.js";

const TEST_PREFIX = "__test_publisher_";

describe("PublisherService", () => {
	const db = getDb();
	const service = new PublisherService({ db });

	async function cleanup() {
		// Clean email sends for test content
		const testContent = await db
			.select()
			.from(content)
			.where(like(content.title, `${TEST_PREFIX}%`));

		for (const c of testContent) {
			await db.delete(emailSends).where(eq(emailSends.contentId, c.id));
			await db
				.delete(contentCalendar)
				.where(eq(contentCalendar.contentId, c.id));
		}

		// Clean suppressions with test emails
		await db
			.delete(emailSuppressions)
			.where(like(emailSuppressions.email, `${TEST_PREFIX}%`));

		// Clean calendar entries with test channel marker
		await db
			.delete(contentCalendar)
			.where(like(contentCalendar.channel, `${TEST_PREFIX}%`));

		// Clean test content rows
		await db.delete(content).where(like(content.title, `${TEST_PREFIX}%`));
	}

	beforeEach(async () => {
		await cleanup();
	});

	afterEach(async () => {
		await cleanup();
	});

	it("publish updates content status and publishedAt", async () => {
		const rows = await db
			.insert(content)
			.values({
				type: "blog_post",
				body: "Test blog content",
				title: `${TEST_PREFIX}publish_blog`,
				status: "approved",
			})
			.returning();

		const contentId = rows[0].id;
		const result = await service.publish(contentId, "blog");

		expect(result.ok).toBe(true);
		if (!result.ok) return;

		expect(result.data.contentId).toBe(contentId);
		expect(result.data.channel).toBe("blog");
		expect(result.data.publishedAt).toBeDefined();

		// Verify DB was updated
		const updated = await db
			.select()
			.from(content)
			.where(eq(content.id, contentId));

		expect(updated[0].status).toBe("published");
		expect(updated[0].publishedAt).toBeDefined();
	});

	it("publish returns error for non-existent content", async () => {
		const result = await service.publish(999999, "blog");

		expect(result.ok).toBe(false);
		if (result.ok) return;

		expect(result.error.code).toBe("PUBLISHER_CONTENT_NOT_FOUND");
	});

	it("schedule creates calendar entry", async () => {
		const rows = await db
			.insert(content)
			.values({
				type: "blog_post",
				body: "Test schedule content",
				title: `${TEST_PREFIX}schedule_blog`,
				status: "draft",
			})
			.returning();

		const contentId = rows[0].id;
		const scheduledDate = new Date("2026-04-01T10:00:00Z");
		const result = await service.schedule(contentId, "blog", scheduledDate);

		expect(result.ok).toBe(true);

		// Verify calendar entry
		const entries = await db
			.select()
			.from(contentCalendar)
			.where(eq(contentCalendar.contentId, contentId));

		expect(entries.length).toBe(1);
		expect(entries[0].channel).toBe("blog");
		expect(entries[0].scheduledFor).toBe(scheduledDate.toISOString());
		expect(entries[0].status).toBe("scheduled");
	});

	it("getCalendar returns entries in date range", async () => {
		const rows = await db
			.insert(content)
			.values({
				type: "blog_post",
				body: "Test calendar content",
				title: `${TEST_PREFIX}calendar_blog`,
				status: "draft",
			})
			.returning();

		const contentId = rows[0].id;

		// Schedule entries at different times
		await service.schedule(contentId, "blog", new Date("2026-04-05T10:00:00Z"));
		await service.schedule(contentId, "email", new Date("2026-04-10T10:00:00Z"));
		await service.schedule(contentId, "blog", new Date("2026-04-20T10:00:00Z"));

		// Query for April 1-15 range
		const entries = await service.getCalendar({
			start: new Date("2026-04-01T00:00:00Z"),
			end: new Date("2026-04-15T23:59:59Z"),
		});

		const testEntries = entries.filter((e) => e.contentId === contentId);
		expect(testEntries.length).toBe(2);
	});

	it("sendEmail skips suppressed addresses", async () => {
		const rows = await db
			.insert(content)
			.values({
				type: "cold_email",
				body: "Test email content",
				title: `${TEST_PREFIX}email_send`,
				status: "approved",
			})
			.returning();

		const contentId = rows[0].id;

		// Suppress one email
		await service.addSuppression(
			`${TEST_PREFIX}bounced@example.com`,
			"bounced",
		);

		const result = await service.sendEmail(contentId, [
			`${TEST_PREFIX}active1@example.com`,
			`${TEST_PREFIX}bounced@example.com`,
			`${TEST_PREFIX}active2@example.com`,
		]);

		expect(result.ok).toBe(true);
		if (!result.ok) return;

		expect(result.data.sent).toBe(2);
		expect(result.data.suppressed).toBe(1);
		expect(result.data.bounced).toBe(0);

		// Verify email send records
		const sends = await db
			.select()
			.from(emailSends)
			.where(eq(emailSends.contentId, contentId));

		expect(sends.length).toBe(2);
	});

	it("addSuppression and isEmailSuppressed work correctly", async () => {
		const email = `${TEST_PREFIX}unsub@example.com`;

		// Should not be suppressed initially
		const before = await service.isEmailSuppressed(email);
		expect(before).toBe(false);

		// Add suppression
		await service.addSuppression(email, "unsubscribed");

		// Should be suppressed now
		const after = await service.isEmailSuppressed(email);
		expect(after).toBe(true);
	});
});
