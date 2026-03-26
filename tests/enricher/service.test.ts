import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { eq } from "drizzle-orm";
import { getDb } from "../../src/core/db/index.js";
import { accounts, contacts, signals } from "../../src/core/db/schema.js";
import { EnricherService } from "../../src/enricher/service.js";

describe("EnricherService", () => {
	const db = getDb();
	let enricher: EnricherService;
	let testAccountId: number;

	beforeEach(async () => {
		enricher = new EnricherService({ db });

		// Clean up any stale test data from prior runs
		const stale = await db
			.select({ id: accounts.id })
			.from(accounts)
			.where(eq(accounts.name, "__test_enricher_account__"));
		for (const row of stale) {
			await db.delete(contacts).where(eq(contacts.accountId, row.id));
			await db.delete(signals).where(eq(signals.accountId, row.id));
			await db.delete(accounts).where(eq(accounts.id, row.id));
		}

		// Create a test account
		const rows = await db
			.insert(accounts)
			.values({
				name: "__test_enricher_account__",
				vertical: "test-segment-b",
			})
			.returning({ id: accounts.id });
		testAccountId = rows[0].id;
	});

	afterEach(async () => {
		// Clean up test data
		await db.delete(contacts).where(eq(contacts.accountId, testAccountId));
		await db.delete(signals).where(eq(signals.accountId, testAccountId));
		await db.delete(accounts).where(eq(accounts.id, testAccountId));
	});

	it("addContact creates a contact record", async () => {
		const contactId = await enricher.addContact(testAccountId, {
			name: "Jane Doe",
			email: "jane@test.com",
			phone: "555-0100",
			role: "Owner",
			isDecisionMaker: true,
		});

		expect(contactId).toBeGreaterThan(0);

		// Verify the contact exists
		const contactRows = await db
			.select()
			.from(contacts)
			.where(eq(contacts.accountId, testAccountId));

		expect(contactRows.length).toBe(1);
		expect(contactRows[0].name).toBe("Jane Doe");
		expect(contactRows[0].email).toBe("jane@test.com");
		expect(contactRows[0].isDecisionMaker).toBe(true);
	});

	it("getProfile returns account with contacts and signals", async () => {
		// Add a contact
		await enricher.addContact(testAccountId, {
			name: "Profile Test Contact",
			email: "profile@test.com",
			role: "Manager",
		});

		// Add a signal directly to verify it's included
		await db.insert(signals).values({
			accountId: testAccountId,
			source: "manual",
			signalType: "site_visit",
			strength: 1.0,
		});

		const profile = await enricher.getProfile(testAccountId);

		expect(profile).not.toBeNull();
		expect(profile!.account.name).toBe("__test_enricher_account__");
		expect(profile!.contacts.length).toBe(1);
		expect(profile!.contacts[0].name).toBe("Profile Test Contact");
		expect(profile!.signals.length).toBe(1);
		expect(profile!.signals[0].signalType).toBe("site_visit");
	});

	it("getProfile returns null for non-existent account", async () => {
		const profile = await enricher.getProfile(999999);
		expect(profile).toBeNull();
	});

	it("enrichFromGooglePlaces updates googlePlaceId", async () => {
		const uniquePlaceId = `ChIJ_test_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
		const result = await enricher.enrichFromGooglePlaces(
			testAccountId,
			uniquePlaceId,
		);

		expect(result.accountId).toBe(testAccountId);
		expect(result.fieldsUpdated).toContain("googlePlaceId");

		// Verify in DB
		const accountRows = await db
			.select()
			.from(accounts)
			.where(eq(accounts.id, testAccountId))
			.limit(1);

		expect(accountRows[0].googlePlaceId).toBe(uniquePlaceId);
	});

	it("enrichFromWebsite updates website field", async () => {
		const result = await enricher.enrichFromWebsite(
			testAccountId,
			"https://example.com",
		);

		expect(result.accountId).toBe(testAccountId);
		expect(result.fieldsUpdated).toContain("website");

		const accountRows = await db
			.select()
			.from(accounts)
			.where(eq(accounts.id, testAccountId))
			.limit(1);

		expect(accountRows[0].website).toBe("https://example.com");
	});
});
