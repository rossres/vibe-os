import { eq, desc, and, sql } from "drizzle-orm";
import { getDb, type Database } from "../core/db/index.js";
import { accounts, signals, contacts, stageTransitions } from "../core/db/schema.js";
import type { AwarenessStage, SignalSource, SignalType } from "../core/types.js";
import { scoreAccount, determineStage, type SignalData } from "./scoring.js";

export interface RadarServiceOptions {
	db?: Database;
}

export interface ScanReport {
	signalsDetected: number;
	accountsCreated: number;
	accountsUpdated: number;
	scoresUpdated: number;
}

interface AddSignalInput {
	source: SignalSource;
	sourceId?: string;
	signalType: SignalType;
	strength: number;
	rawData?: string;
}

interface TargetListFilters {
	tier?: number;
	stage?: AwarenessStage;
	vertical?: string;
	limit?: number;
}

export class RadarService {
	private db: Database;

	constructor(options?: RadarServiceOptions) {
		this.db = options?.db ?? getDb();
	}

	async addSignal(accountId: number, signal: AddSignalInput): Promise<number> {
		// Check for duplicate: same source + sourceId + signalType
		if (signal.sourceId) {
			const existing = await this.db
				.select({ id: signals.id })
				.from(signals)
				.where(
					and(
						eq(signals.accountId, accountId),
						eq(signals.source, signal.source),
						eq(signals.sourceId, signal.sourceId),
						eq(signals.signalType, signal.signalType),
					),
				)
				.limit(1);

			if (existing.length > 0) {
				return existing[0].id;
			}
		}

		const rows = await this.db
			.insert(signals)
			.values({
				accountId,
				source: signal.source,
				sourceId: signal.sourceId ?? null,
				signalType: signal.signalType,
				strength: signal.strength,
				rawData: signal.rawData ?? null,
			})
			.returning({ id: signals.id });

		const signalId = rows[0].id;

		// Re-score the account after adding a signal
		await this.scoreAndUpdateAccount(accountId);

		return signalId;
	}

	async scoreAndUpdateAccount(accountId: number): Promise<void> {
		// Fetch the account
		const accountRows = await this.db
			.select()
			.from(accounts)
			.where(eq(accounts.id, accountId))
			.limit(1);

		if (accountRows.length === 0) return;

		const account = accountRows[0];

		// Fetch all signals for this account
		const accountSignals = await this.db
			.select()
			.from(signals)
			.where(eq(signals.accountId, accountId));

		const signalDataList: SignalData[] = accountSignals.map((s) => ({
			signalType: s.signalType as SignalType,
			strength: s.strength,
			detectedAt: s.detectedAt,
		}));

		// Compute score
		const score = scoreAccount({
			vertical: (account.vertical as import("../core/types.js").VerticalSlug) ?? undefined,
			employeeCount: account.employeeCount ?? undefined,
			reviewCount: account.reviewCount ?? undefined,
			googleRating: account.googleRating ?? undefined,
			signals: signalDataList,
		});

		// Determine new stage
		const newStage = determineStage(signalDataList);
		const oldStage = (account.stage ?? "identified") as AwarenessStage;

		// Update account
		await this.db
			.update(accounts)
			.set({
				fitScore: score.fitScore,
				intentScore: score.intentScore,
				totalScore: score.totalScore,
				tier: score.tier,
				stage: newStage,
				updatedAt: sql`(datetime('now'))`,
			})
			.where(eq(accounts.id, accountId));

		// If stage changed, record the transition
		if (newStage !== oldStage) {
			await this.db.insert(stageTransitions).values({
				accountId,
				fromStage: oldStage,
				toStage: newStage,
				trigger: "score_update",
			});
		}
	}

	async getTargetList(filters?: TargetListFilters) {
		let query = this.db.select().from(accounts).$dynamic();

		const conditions = [];
		if (filters?.tier != null) {
			conditions.push(eq(accounts.tier, filters.tier));
		}
		if (filters?.stage) {
			conditions.push(eq(accounts.stage, filters.stage));
		}
		if (filters?.vertical) {
			conditions.push(eq(accounts.vertical, filters.vertical));
		}

		if (conditions.length > 0) {
			query = query.where(and(...conditions));
		}

		query = query.orderBy(desc(accounts.totalScore));

		if (filters?.limit) {
			query = query.limit(filters.limit);
		}

		return query;
	}

	async getAccountSignals(accountId: number) {
		return this.db
			.select()
			.from(signals)
			.where(eq(signals.accountId, accountId))
			.orderBy(desc(signals.detectedAt));
	}
}
