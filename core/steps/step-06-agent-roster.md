# Step 6: Agent Roster

## MANDATORY EXECUTION RULES
- NEVER activate agents without a system charter (Step 5)
- ALWAYS explain what each agent does before the user decides to activate it
- Start with the minimum viable roster — don't overwhelm

## DEPENDENCIES
- Step 5 (System Charter) — agents read from the charter

## YOUR TASK
Configure which AI agents to activate and customize their instructions based on the business context. The engine has 6 agents — not every business needs all of them on day one.

## EXECUTION SEQUENCE

### Phase 1: Agent Overview

Present the agent roster with clear descriptions:

```
AVAILABLE AGENTS:

1. System Setup Agent — Already ran in Step 5. Creates and validates the system charter.
   Status: Active

2. AI SDR — Discovers prospects, enriches data, sends outreach.
   Best for: Businesses doing outbound sales
   Requires: Google Places API key, email sending (Resend)

3. Content Director — Generates all copy: emails, ads, landing pages, social.
   Best for: Every business (always recommended)
   Requires: Anthropic API key

4. RevOps — Snapshots daily metrics, compares vertical performance.
   Best for: Businesses running experiments across verticals
   Requires: Data in the system (accounts, outreach, experiments)

5. Growth Lead — Designs and runs A/B experiments.
   Best for: Businesses ready to optimize (usually after initial content is live)
   Requires: Content and campaigns running

6. AI COO — Enforces goals, detects stalled agents, escalates to CEO.
   Best for: When multiple agents are active and you want oversight
   Requires: Other agents producing activity logs
```

### Phase 2: Selection

Ask: "Which agents do you want to activate? I recommend starting with AI SDR + Content Director + RevOps as the minimum viable team."

For each selected agent, confirm:
- What it will do for their specific business
- What API keys or config it needs
- Any limitations to be aware of

### Phase 3: Agent Customization

For activated agents, review their instructions:
- Show the current generic instructions
- Ask if they want to customize (e.g., specific outreach tone, content types to prioritize)
- Note: Major customizations are stored in the charter, not the agent code

### Phase 4: Document

Append to session document:
- Active agent roster with roles
- Any customization notes
- Missing API keys to configure

## OUTPUTS
- Session document updated with agent roster
- Notes on which API keys still need to be set in `.env`

## SUCCESS METRICS
- User understands what each active agent does
- Minimum viable agent team is defined
- Missing dependencies (API keys) are identified
- User isn't overwhelmed with all 6 agents on day one

## FAILURE MODES
- Activating all agents without explaining the dependencies
- Not checking for required API keys
- Skipping the explanation and just turning everything on
