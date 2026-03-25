import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { getDb } from "../../../core/db";
import { systemCharter } from "../../../core/db/schema";
import { eq, desc } from "drizzle-orm";

export async function saveSystemCharterFn(input: { charter: any; createdBy: string }) {
  const db = getDb();
  const current = await db.select().from(systemCharter)
    .where(eq(systemCharter.isActive, 1)).orderBy(desc(systemCharter.version)).limit(1);
  const nextVersion = current.length > 0 ? current[0].version + 1 : 1;
  if (current.length > 0) {
    await db.update(systemCharter)
      .set({ isActive: 0, supersededAt: new Date().toISOString() })
      .where(eq(systemCharter.id, current[0].id));
  }
  const charterId = crypto.randomUUID();
  await db.insert(systemCharter).values({
    id: charterId, version: nextVersion, phase: input.charter.phase ?? "phase_1_prove_vertical",
    charterData: JSON.stringify(input.charter), isActive: 1,
    createdBy: input.createdBy, createdAt: new Date().toISOString(),
  });
  return { charterId, version: nextVersion };
}

export const saveSystemCharter = createTool({
  id: "save-system-charter",
  description: "Creates a new system charter version and marks older active versions inactive.",
  inputSchema: z.object({ charter: z.any(), createdBy: z.string() }),
  outputSchema: z.object({ charterId: z.string(), version: z.number() }),
  execute: async (args: any) => { return await saveSystemCharterFn(args.context ?? args); },
});
