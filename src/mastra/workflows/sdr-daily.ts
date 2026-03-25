import { loadCharter, logActivity, readInbox } from "./helpers";
import { getVerticalAllocationFn } from "../tools/policy/get-vertical-allocation";
import { checkOutreachDedupeFn } from "../tools/policy/check-outreach-dedupe";
import { getDb } from "../../core/db";
import { accounts, contacts, content } from "../../core/db/schema";
import { eq, and, isNull, sql, desc } from "drizzle-orm";
import { GooglePlacesDiscovery } from "../../discovery/google-places.js";
import { ApolloEnricher } from "../../discovery/apollo.js";
import { RadarService } from "../../radar/service.js";
import type { VerticalSlug } from "../../core/types";

export async function sdrDaily() {
  const charter = await loadCharter();
  if (!charter) throw new Error("No active system charter — run Phase 0 first");
  const db = getDb();
  const allocation = await getVerticalAllocationFn();
  const inbox = await readInbox("ai-sdr");
  const actions: unknown[] = [];
  const metrics = {
    accounts_discovered: 0,
    accounts_enriched: 0,
    contacts_found: 0,
    emails_queued: 0,
    sequences_active: 0,
  };

  actions.push({ action: "read_inbox", tasks_found: inbox.length });
  actions.push({ action: "load_allocation", primary: allocation.primary, allocation: allocation.allocation });

  // ── STEP 1: Discover prospects via Google Places ──────────
  const dailyDiscoveryTarget = 50;
  const verticals = Object.entries(allocation.allocation).map(([vertical, weight]) => ({
    vertical: vertical as VerticalSlug,
    targetCount: Math.ceil(dailyDiscoveryTarget * (weight as number)),
  }));

  try {
    const discovery = new GooglePlacesDiscovery();
    const report = await discovery.discover(verticals);
    metrics.accounts_discovered = report.accountsDiscovered;
    actions.push({ action: "discover", ...report.byVertical, total: report.accountsDiscovered });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("[SDR] Discovery failed:", msg);
    actions.push({ action: "discover_failed", error: msg });
  }

  // ── STEP 2: Enrich unenriched accounts via Apollo ─────────
  const apollo = new ApolloEnricher();
  if (apollo.isConfigured) {
    try {
      for (const { vertical } of verticals) {
        const unenriched = await apollo.getUnenrichedAccounts(vertical, 20);
        if (unenriched.length > 0) {
          const results = await apollo.enrichBatch(unenriched);
          const totalContacts = results.reduce((sum, r) => sum + r.contactsFound, 0);
          const totalEmails = results.reduce((sum, r) => sum + r.emailsFound, 0);
          metrics.accounts_enriched += unenriched.length;
          metrics.contacts_found += totalContacts;

          // Mark accounts as enriched
          for (const id of unenriched) {
            await db.update(accounts).set({ enrichedAt: sql`(datetime('now'))` }).where(eq(accounts.id, id));
          }

          actions.push({ action: "enrich", vertical, accounts: unenriched.length, contacts: totalContacts, emails: totalEmails });
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      console.error("[SDR] Enrichment failed:", msg);
      actions.push({ action: "enrich_failed", error: msg });
    }
  } else {
    actions.push({ action: "enrich_skipped", reason: "APOLLO_API_KEY not configured" });
  }

  // ── STEP 3: Score new accounts ────────────────────────────
  const radar = new RadarService();
  const unscoredAccounts = await db
    .select({ id: accounts.id })
    .from(accounts)
    .where(and(eq(accounts.totalScore, 0), isNull(accounts.tier)))
    .limit(100);

  for (const { id } of unscoredAccounts) {
    await radar.scoreAndUpdateAccount(id);
  }
  if (unscoredAccounts.length > 0) {
    actions.push({ action: "score", accounts: unscoredAccounts.length });
  }

  // ── STEP 4: Apollo Sequences — check status ───────────────
  if (apollo.isConfigured) {
    try {
      const sequences = await apollo.listSequences();
      const activeSequences = sequences.filter(s => s.active);
      metrics.sequences_active = activeSequences.length;

      for (const seq of activeSequences) {
        const stats = await apollo.getSequenceStats(seq.id);
        if (stats) {
          actions.push({
            action: "sequence_status",
            name: seq.name,
            contacts: stats.totalContacts,
            sent: stats.emailsSent,
            opens: stats.opens,
            replies: stats.replies,
            bounces: stats.bounces,
          });
        }
      }

      // If no active sequences exist, report it
      if (activeSequences.length === 0) {
        actions.push({
          action: "no_active_sequences",
          note: "No Apollo sequences are active. Create sequences and add contacts to start outreach.",
          total_sequences: sequences.length,
        });
      }

      // Find contacts with emails that haven't been outreached
      const readyContacts = await db
        .select({
          contactId: contacts.id,
          contactEmail: contacts.email,
          contactName: contacts.name,
          accountId: accounts.id,
          accountName: accounts.name,
          vertical: accounts.vertical,
        })
        .from(contacts)
        .innerJoin(accounts, eq(contacts.accountId, accounts.id))
        .where(
          and(
            sql`${contacts.email} IS NOT NULL`,
            sql`${contacts.email} != ''`,
            isNull(accounts.lastOutreachAt),
            eq(contacts.isDecisionMaker, true),
          ),
        )
        .orderBy(desc(accounts.totalScore))
        .limit(50);

      metrics.emails_queued = readyContacts.length;
      actions.push({
        action: "contacts_ready_for_sequence",
        count: readyContacts.length,
        note: "These contacts have emails and haven't been outreached. Add them to an Apollo sequence to start sending.",
      });

    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      console.error("[SDR] Sequence check failed:", msg);
      actions.push({ action: "sequence_check_failed", error: msg });
    }
  }

  await logActivity("ai-sdr", actions, metrics);
  return { status: "completed", metrics };
}
