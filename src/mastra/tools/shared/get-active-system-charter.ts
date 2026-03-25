import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { getDb } from "../../../core/db";
import { systemCharter } from "../../../core/db/schema";
import { eq, desc } from "drizzle-orm";

export async function getActiveCharterFn() {
  const db = getDb();
  const results = await db
    .select()
    .from(systemCharter)
    .where(eq(systemCharter.isActive, 1))
    .orderBy(desc(systemCharter.version))
    .limit(1);
  if (results.length === 0) return null;
  return { ...results[0], charter: JSON.parse(results[0].charterData) };
}

export const getActiveSystemCharter = createTool({
  id: "get-active-system-charter",
  description: "Returns the active system charter used to govern all Phase 1 behavior.",
  inputSchema: z.object({}),
  outputSchema: z.object({ charter: z.any() }),
  execute: async () => {
    const result = await getActiveCharterFn();
    return { charter: result };
  },
});
