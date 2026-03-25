import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { getDb } from "../../../core/db";
import { outreachEvents } from "../../../core/db/schema";
import { eq, and, gte } from "drizzle-orm";

export async function checkOutreachDedupeFn(input: {
  accountId: number; contactId?: number; channel: string; messageHash?: string; lookbackDays?: number;
}) {
  const db = getDb();
  const lookback = input.lookbackDays ?? 14;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - lookback);
  const conditions = [
    eq(outreachEvents.accountId, input.accountId),
    eq(outreachEvents.channel, input.channel),
    gte(outreachEvents.sentAt, cutoff.toISOString()),
  ];
  const recent = await db.select().from(outreachEvents).where(and(...conditions)).limit(1);
  if (recent.length > 0) return { allowed: false, reason: "Recent matching outreach found within lookback window." };
  return { allowed: true };
}

export const checkOutreachDedupe = createTool({
  id: "check-outreach-dedupe",
  description: "Ensure the system does not send duplicate outreach through the same channel too soon.",
  inputSchema: z.object({
    accountId: z.number(), contactId: z.number().optional(),
    channel: z.enum(["email", "sms", "call", "voicemail"]),
    messageHash: z.string().optional(), lookbackDays: z.number().default(14),
  }),
  outputSchema: z.object({ allowed: z.boolean(), reason: z.string().optional() }),
  execute: async (args: any) => await checkOutreachDedupeFn(args.context ?? args),
});
