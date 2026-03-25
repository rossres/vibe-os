import { loadCharter, logActivity, readInbox } from "./helpers";
import { getDb } from "../../core/db";
import { content } from "../../core/db/schema";
import { eq, and } from "drizzle-orm";
import { BrainService } from "../../brain/service.js";
import { CopywriterService } from "../../copywriter/service.js";
import type { ContentType, VerticalSlug, PersonaSlug } from "../../core/types";

const BRAND_CONFIG_PATH = "./config/brand.yaml";

const CONTENT_TYPES_NEEDED: ContentType[] = ["cold_email", "landing_page"];
const PERSONAS: PersonaSlug[] = ["sofia", "david"];

export async function contentDaily() {
  const charter = await loadCharter();
  if (!charter) throw new Error("No active system charter — run Phase 0 first");
  const db = getDb();
  const brain = new BrainService({ brandConfigPath: BRAND_CONFIG_PATH });
  const copywriter = new CopywriterService({ brain });
  const inbox = await readInbox("content-director");
  const actions: unknown[] = [];
  let produced = 0;
  let failed = 0;

  actions.push({ action: "read_inbox", tasks_found: inbox.length });

  const verticals = [charter.verticals.primary, ...charter.verticals.shadow] as VerticalSlug[];

  // Generate missing content templates for each vertical
  for (const vertical of verticals) {
    for (const contentType of CONTENT_TYPES_NEEDED) {
      // Check if approved content exists for this vertical + type
      const existing = await db
        .select({ id: content.id })
        .from(content)
        .where(
          and(
            eq(content.type, contentType),
            eq(content.vertical, vertical),
            eq(content.status, "approved"),
          ),
        )
        .limit(1);

      if (existing.length > 0) continue;

      // Generate content for each persona
      for (const persona of PERSONAS) {
        const result = await copywriter.generate({
          type: contentType,
          vertical,
          persona,
          stage: "identified",
          variants: contentType === "cold_email" ? 3 : 1,
        });

        if (!result.ok) {
          console.error(`[Content] Generation failed for ${contentType}/${vertical}/${persona}:`, result.error.message);
          failed++;
          actions.push({ action: "generation_failed", contentType, vertical, persona, error: result.error.code });
          continue;
        }

        // Store each variant as a content record
        for (const variant of result.data.variants) {
          const body = JSON.stringify(variant.content);
          const validationFailures = brain.validateContent(body);
          const passesGovernance = validationFailures.length === 0;

          await db.insert(content).values({
            type: contentType,
            status: passesGovernance ? "approved" : "review",
            vertical,
            persona,
            stage: "identified",
            channel: contentType === "cold_email" ? "email" : contentType === "landing_page" ? "blog" : "email",
            title: (variant.content as Record<string, unknown>).subject as string ?? `${contentType} - ${vertical} - ${persona}`,
            body,
            generationPrompt: `${contentType}/${vertical}/${persona}/identified`,
            approvedForUse: passesGovernance ? 1 : 0,
            approvedAt: passesGovernance ? new Date().toISOString() : null,
          });
          produced++;
        }

        actions.push({ action: "generated", contentType, vertical, persona, variants: result.data.variants.length });
      }
    }
  }

  // Process inbox tasks (e.g., requests from growth-lead for experiment variants)
  for (const task of inbox) {
    if (task.taskType === "generate_variant") {
      const payload = JSON.parse(task.payload);
      const result = await copywriter.generate({
        type: payload.contentType ?? "cold_email",
        vertical: payload.vertical,
        persona: payload.persona ?? "sofia",
        stage: payload.stage ?? "identified",
        variants: payload.variants ?? 2,
      });

      if (result.ok) {
        for (const variant of result.data.variants) {
          await db.insert(content).values({
            type: payload.contentType ?? "cold_email",
            status: "approved",
            vertical: payload.vertical,
            persona: payload.persona ?? "sofia",
            body: JSON.stringify(variant.content),
            experimentId: payload.experimentId ?? null,
            approvedForUse: 1,
            approvedAt: new Date().toISOString(),
          });
          produced++;
        }
        actions.push({ action: "fulfilled_request", from: task.fromAgent, contentType: payload.contentType, variants: result.data.variants.length });
      }
    }
  }

  const governancePassRate = produced > 0 ? (produced - failed) / produced : 1.0;

  await logActivity("content-director", actions, {
    pieces_produced: produced,
    pieces_failed: failed,
    governance_pass_rate: governancePassRate,
    requests_fulfilled: inbox.length,
  });

  return { produced, failed, governance_pass_rate: governancePassRate };
}
