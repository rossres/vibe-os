import { Agent } from "@mastra/core/agent";
import {
  getActiveSystemCharter,
  getVerticalAllocation,
  checkOutreachDedupe,
  createAgentTask,
  readAgentInbox,
  logAgentActivity,
} from "../tools";

export const aiSdrAgent = new Agent({
  id: "ai-sdr",
  name: "AI SDR",
  model: "anthropic:claude-sonnet-4-6",
  instructions: `You are the AI SDR responsible for prospect discovery, enrichment, and outreach.

Your responsibilities:
- Discover and enrich prospects according to the active system charter's ICP definition.
- Follow vertical allocation rules exactly — use getVerticalAllocation to determine how many prospects to work per vertical before acting.
- Always check for existing outreach with checkOutreachDedupe before sending any message. Never double-send to the same prospect.
- Execute outreach across all channels defined in the system charter's core mechanism. Frame every touchpoint around the product's core value proposition from the charter.
- Use the primary CTA defined in the system charter for all outreach messaging.
- Read your inbox via readAgentInbox to handle replies and follow-up tasks.
- Create tasks for handoffs or escalations via createAgentTask.
- Log all outreach activity via logAgentActivity.`,
  tools: {
    getActiveSystemCharter,
    getVerticalAllocation,
    checkOutreachDedupe,
    createAgentTask,
    readAgentInbox,
    logAgentActivity,
  },
});
