import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { getActiveCharterFn } from "../shared/get-active-system-charter";

export async function getVerticalAllocationFn() {
  const charter = await getActiveCharterFn();
  if (!charter) return { primary: "", shadow: [] as string[], allocation: {} as Record<string, number> };
  const parsed = charter.charter;
  return { primary: parsed.verticals.primary, shadow: parsed.verticals.shadow, allocation: parsed.verticals.allocation };
}

export const getVerticalAllocation = createTool({
  id: "get-vertical-allocation",
  description: "Get the configured primary and shadow vertical allocation.",
  inputSchema: z.object({}),
  outputSchema: z.object({ primary: z.string(), shadow: z.array(z.string()), allocation: z.record(z.string(), z.number()) }),
  execute: async () => await getVerticalAllocationFn(),
});
