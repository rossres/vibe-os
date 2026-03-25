import { eq, isNull, and, sql } from "drizzle-orm";
import { getDb, type Database } from "../core/db/index.js";
import { accounts, contacts, outreachEvents } from "../core/db/schema.js";

export interface ApolloOptions {
	db?: Database;
	apiKey?: string;
}

export interface ApolloEnrichmentResult {
	accountId: number;
	contactsFound: number;
	emailsFound: number;
}

interface ApolloPerson {
	id?: string;
	first_name?: string;
	last_name?: string;
	email?: string;
	title?: string;
	linkedin_url?: string;
	phone_numbers?: Array<{ sanitized_number?: string }>;
	revealed_for_current_team?: boolean;
}

interface ApolloSearchResult {
	people?: ApolloPerson[];
}

export class ApolloEnricher {
	private db: Database;
	private apiKey: string;

	constructor(options?: ApolloOptions) {
		this.db = options?.db ?? getDb();
		this.apiKey = options?.apiKey ?? process.env.APOLLO_API_KEY ?? "";
	}

	get isConfigured(): boolean {
		return this.apiKey.length > 0;
	}

	async enrichAccount(accountId: number): Promise<ApolloEnrichmentResult> {
		const result: ApolloEnrichmentResult = {
			accountId,
			contactsFound: 0,
			emailsFound: 0,
		};

		if (!this.isConfigured) return result;

		const accountRows = await this.db
			.select()
			.from(accounts)
			.where(eq(accounts.id, accountId))
			.limit(1);

		if (accountRows.length === 0) return result;
		const account = accountRows[0];

		// Extract domain from website
		let domain: string | null = null;
		try {
			if (account.website) {
				const url = account.website.startsWith("http")
					? account.website
					: `https://${account.website}`;
				domain = new URL(url).hostname.replace("www.", "");
			}
		} catch {
			// Invalid URL
		}

		if (!domain) return result;

		// Step 1: Search for people at this company
		const people = await this.searchPeople(domain);
		if (!people || people.length === 0) return result;

		// Step 2: For each person, reveal their full details (costs 1 credit per reveal)
		for (const person of people) {
			let email = person.email;
			let lastName = person.last_name;
			let linkedinUrl = person.linkedin_url;
			let title = person.title;
			const apolloId = person.id;

			// Reveal full details via people/match (gives email, last name, LinkedIn)
			if (apolloId) {
				const revealed = await this.revealPerson(apolloId);
				if (revealed) {
					email = revealed.email ?? email;
					lastName = revealed.lastName ?? lastName;
					linkedinUrl = revealed.linkedinUrl ?? linkedinUrl;
					title = revealed.title ?? title;
				}
			}

			const name = [person.first_name, lastName]
				.filter(Boolean)
				.join(" ");
			const phone = person.phone_numbers?.[0]?.sanitized_number ?? null;
			const isDecisionMaker =
				/owner|founder|ceo|manager|director|president/i.test(
					title ?? "",
				);

			// Skip if no useful contact info
			if (!email && !phone) continue;

			// Skip if contact with same email already exists
			if (email) {
				const existing = await this.db
					.select({ id: contacts.id })
					.from(contacts)
					.where(
						and(
							eq(contacts.accountId, accountId),
							eq(contacts.email, email),
						),
					)
					.limit(1);

				if (existing.length > 0) continue;
			}

			await this.db.insert(contacts).values({
				accountId,
				name: name || null,
				email: email ?? null,
				phone,
				linkedinUrl: linkedinUrl ?? null,
				role: title ?? null,
				isDecisionMaker,
			});

			result.contactsFound++;
			if (email) result.emailsFound++;
		}

		return result;
	}

	async enrichBatch(
		accountIds: number[],
	): Promise<ApolloEnrichmentResult[]> {
		const results: ApolloEnrichmentResult[] = [];
		for (const id of accountIds) {
			const result = await this.enrichAccount(id);
			results.push(result);
			// Rate limiting — Apollo has limits
			await new Promise((r) => setTimeout(r, 500));
		}
		return results;
	}

	async getUnenrichedAccounts(
		vertical?: string,
		limit = 50,
	): Promise<number[]> {
		const conditions = [isNull(accounts.enrichedAt)];
		if (vertical) {
			conditions.push(eq(accounts.vertical, vertical));
		}

		const rows = await this.db
			.select({ id: accounts.id })
			.from(accounts)
			.where(and(...conditions))
			.limit(limit);

		return rows.map((r) => r.id);
	}

	/**
	 * Step 1: Search for people at a domain. Returns people with IDs but without emails.
	 */
	private async searchPeople(domain: string): Promise<ApolloPerson[] | null> {
		try {
			const response = await fetch(
				"https://api.apollo.io/api/v1/mixed_people/api_search",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						"X-Api-Key": this.apiKey,
					},
					body: JSON.stringify({
						q_organization_domains: domain,
						page: 1,
						per_page: 5,
						person_titles: [
							"owner",
							"founder",
							"ceo",
							"manager",
							"office manager",
							"front desk manager",
							"director",
							"president",
						],
					}),
				},
			);

			if (!response.ok) {
				console.error(
					`[Apollo] Search error: ${response.status} ${response.statusText}`,
				);
				return null;
			}

			const data = (await response.json()) as ApolloSearchResult;
			return data.people ?? [];
		} catch (e) {
			console.error("[Apollo] Search failed:", e);
			return null;
		}
	}

	/**
	 * Step 2: Reveal a person's full details using their Apollo ID. Costs 1 credit.
	 * Returns email, last name, LinkedIn URL, and other data not available in search.
	 */
	private async revealPerson(apolloId: string): Promise<{
		email: string | null;
		lastName: string | null;
		linkedinUrl: string | null;
		title: string | null;
	} | null> {
		try {
			const response = await fetch(
				"https://api.apollo.io/api/v1/people/match",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						"X-Api-Key": this.apiKey,
					},
					body: JSON.stringify({
						id: apolloId,
						reveal_personal_emails: true,
					}),
				},
			);

			if (!response.ok) {
				console.error(
					`[Apollo] Reveal error: ${response.status} ${response.statusText}`,
				);
				return null;
			}

			const data = (await response.json()) as {
				person?: {
					email?: string;
					last_name?: string;
					linkedin_url?: string;
					title?: string;
				};
			};
			const p = data.person;
			if (!p) return null;
			return {
				email: p.email ?? null,
				lastName: p.last_name ?? null,
				linkedinUrl: p.linkedin_url ?? null,
				title: p.title ?? null,
			};
		} catch (e) {
			console.error("[Apollo] Reveal failed:", e);
			return null;
		}
	}

	// ── Sequence / Outreach Methods ─────────────────────────

	/**
	 * List available sequences in Apollo.
	 */
	async listSequences(): Promise<Array<{ id: string; name: string; active: boolean; num_steps: number }>> {
		try {
			const response = await fetch("https://api.apollo.io/api/v1/emailer_campaigns/search", {
				method: "POST",
				headers: { "Content-Type": "application/json", "X-Api-Key": this.apiKey },
				body: JSON.stringify({ page: 1, per_page: 50 }),
			});
			if (!response.ok) {
				console.error(`[Apollo] List sequences error: ${response.status}`);
				return [];
			}
			const data = await response.json() as any;
			return (data.emailer_campaigns ?? []).map((s: any) => ({
				id: s.id,
				name: s.name,
				active: s.active,
				num_steps: s.emailer_steps?.length ?? 0,
			}));
		} catch (e) {
			console.error("[Apollo] List sequences failed:", e);
			return [];
		}
	}

	/**
	 * Create a new email sequence in Apollo.
	 */
	async createSequence(input: {
		name: string;
		steps: Array<{ subject: string; body: string; delayDays?: number }>;
	}): Promise<string | null> {
		try {
			const response = await fetch("https://api.apollo.io/api/v1/emailer_campaigns", {
				method: "POST",
				headers: { "Content-Type": "application/json", "X-Api-Key": this.apiKey },
				body: JSON.stringify({
					name: input.name,
					permissions: "team_can_use",
					active: false, // Start paused for review
					emailer_steps: input.steps.map((step, i) => ({
						type: "auto_email",
						wait_time: i === 0 ? 0 : (step.delayDays ?? 3),
						wait_mode: "day",
						exact_datetime: null,
						priority: "normal",
						note: null,
						template: {
							subject: step.subject,
							body: step.body,
						},
					})),
				}),
			});

			if (!response.ok) {
				const body = await response.text();
				console.error(`[Apollo] Create sequence error: ${response.status}`, body.slice(0, 300));
				return null;
			}

			const data = await response.json() as any;
			return data.emailer_campaign?.id ?? null;
		} catch (e) {
			console.error("[Apollo] Create sequence failed:", e);
			return null;
		}
	}

	/**
	 * Add contacts to an Apollo sequence. This starts sending.
	 */
	async addContactsToSequence(sequenceId: string, contactEmails: string[]): Promise<{
		added: number;
		failed: number;
	}> {
		try {
			const response = await fetch("https://api.apollo.io/api/v1/emailer_campaigns/add_contact_ids", {
				method: "POST",
				headers: { "Content-Type": "application/json", "X-Api-Key": this.apiKey },
				body: JSON.stringify({
					emailer_campaign_id: sequenceId,
					contact_ids: [], // We'll use emails instead
					send_email_from_email_account_id: null, // Uses default connected mailbox
					contact_emails: contactEmails,
				}),
			});

			if (!response.ok) {
				const body = await response.text();
				console.error(`[Apollo] Add contacts error: ${response.status}`, body.slice(0, 300));
				return { added: 0, failed: contactEmails.length };
			}

			const data = await response.json() as any;
			return {
				added: data.contacts?.length ?? contactEmails.length,
				failed: 0,
			};
		} catch (e) {
			console.error("[Apollo] Add contacts failed:", e);
			return { added: 0, failed: contactEmails.length };
		}
	}

	/**
	 * Get sequence analytics.
	 */
	async getSequenceStats(sequenceId: string): Promise<{
		totalContacts: number;
		emailsSent: number;
		opens: number;
		clicks: number;
		replies: number;
		bounces: number;
	} | null> {
		try {
			const response = await fetch(`https://api.apollo.io/api/v1/emailer_campaigns/${sequenceId}`, {
				headers: { "Content-Type": "application/json", "X-Api-Key": this.apiKey },
			});
			if (!response.ok) return null;
			const data = await response.json() as any;
			const campaign = data.emailer_campaign;
			return {
				totalContacts: campaign?.num_contacts ?? 0,
				emailsSent: campaign?.num_sent ?? 0,
				opens: campaign?.unique_opens ?? 0,
				clicks: campaign?.unique_clicks ?? 0,
				replies: campaign?.unique_replies ?? 0,
				bounces: campaign?.num_bounced ?? 0,
			};
		} catch {
			return null;
		}
	}

	/**
	 * Record outreach in our local DB for tracking/dedupe.
	 */
	async recordOutreach(accountId: number, contactId: number, email: string, sequenceId: string): Promise<void> {
		await this.db.insert(outreachEvents).values({
			id: crypto.randomUUID(),
			accountId,
			contactId,
			channel: "email",
			templateId: sequenceId,
			deliveryStatus: "sent",
			sentAt: new Date().toISOString(),
		});

		// Update last outreach timestamp on account
		await this.db.update(accounts).set({
			lastOutreachAt: sql`(datetime('now'))`,
		}).where(eq(accounts.id, accountId));
	}
}
