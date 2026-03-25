import { eq, desc, sql } from "drizzle-orm";
import { getDb, type Database } from "../core/db/index.js";
import { accounts, contacts, signals } from "../core/db/schema.js";

export interface EnricherServiceOptions {
	googlePlacesApiKey?: string;
}

export interface EnrichmentResult {
	accountId: number;
	fieldsUpdated: string[];
}

interface AddContactInput {
	name?: string;
	email?: string;
	phone?: string;
	role?: string;
	isDecisionMaker?: boolean;
}

export class EnricherService {
	private db: Database;
	private googlePlacesApiKey?: string;

	constructor(options?: EnricherServiceOptions & { db?: Database }) {
		this.db = options?.db ?? getDb();
		this.googlePlacesApiKey = options?.googlePlacesApiKey;
	}

	async enrichFromGooglePlaces(
		accountId: number,
		placeId: string,
	): Promise<EnrichmentResult> {
		const fieldsUpdated: string[] = [];

		await this.db
			.update(accounts)
			.set({
				googlePlaceId: placeId,
				enrichedAt: sql`(datetime('now'))`,
				updatedAt: sql`(datetime('now'))`,
			})
			.where(eq(accounts.id, accountId));

		fieldsUpdated.push("googlePlaceId", "enrichedAt");

		return { accountId, fieldsUpdated };
	}

	async enrichFromWebsite(
		accountId: number,
		url: string,
	): Promise<EnrichmentResult> {
		const fieldsUpdated: string[] = [];

		await this.db
			.update(accounts)
			.set({
				website: url,
				enrichedAt: sql`(datetime('now'))`,
				updatedAt: sql`(datetime('now'))`,
			})
			.where(eq(accounts.id, accountId));

		fieldsUpdated.push("website", "enrichedAt");

		return { accountId, fieldsUpdated };
	}

	async addContact(accountId: number, contact: AddContactInput): Promise<number> {
		const rows = await this.db
			.insert(contacts)
			.values({
				accountId,
				name: contact.name ?? null,
				email: contact.email ?? null,
				phone: contact.phone ?? null,
				role: contact.role ?? null,
				isDecisionMaker: contact.isDecisionMaker ?? false,
			})
			.returning({ id: contacts.id });

		return rows[0].id;
	}

	async getProfile(accountId: number) {
		const accountRows = await this.db
			.select()
			.from(accounts)
			.where(eq(accounts.id, accountId))
			.limit(1);

		if (accountRows.length === 0) return null;

		const accountContacts = await this.db
			.select()
			.from(contacts)
			.where(eq(contacts.accountId, accountId));

		const accountSignals = await this.db
			.select()
			.from(signals)
			.where(eq(signals.accountId, accountId))
			.orderBy(desc(signals.detectedAt));

		return {
			account: accountRows[0],
			contacts: accountContacts,
			signals: accountSignals,
		};
	}
}
