# Step 1: Session Setup

## MANDATORY EXECUTION RULES
- NEVER assume what the business does — ASK
- NEVER skip the goal-setting conversation
- ALWAYS create the session document before proceeding

## YOUR TASK
Understand the user's business, goals, and timeline. Create the session document that will track progress through all 15 steps. This is the foundation everything else builds on.

## EXECUTION SEQUENCE

### Phase 1: Business Discovery

Ask these questions (adapt based on what the user volunteers):

1. **What does your business do?** — Get the one-sentence version.
2. **Who do you sell to?** — Industries, company sizes, roles.
3. **What's your primary go-to-market motion?** — Inbound, outbound, product-led, partner-led.
4. **What's working today?** — What channels or approaches are already producing results.
5. **What's not working?** — What they've tried that hasn't landed.
6. **What's the goal for this project?** — Revenue target, customer count, timeline.

Don't interrogate — have a conversation. If they give you a website or docs, read them and confirm your understanding before moving on.

### Phase 2: Goal Setting

Based on the discovery, help them articulate:
- **Primary metric** — the one number they're optimizing for (e.g., "50 customers in 30 days")
- **Primary vertical** — the market segment they're starting with
- **Budget constraints** — what they can spend on ads, tools, outreach
- **Timeline** — when they need results by

### Phase 3: Create Session Document

Create the file `output/startup-os-{date}.md` with:

```yaml
---
project_name: "{from conversation}"
started_at: "{today's date}"
steps_completed: [1]
steps_skipped: []
rerun_queue: []
session_goals: "{primary metric}"
primary_vertical: "{from conversation}"
target_customers: "{who they sell to}"
budget: "{from conversation}"
timeline: "{from conversation}"
---

# Vibe OS — {project_name}

## Step 1: Session Setup

### Business Summary
{one paragraph summary of the business}

### Goals
- Primary metric: {metric}
- Primary vertical: {vertical}
- Budget: {budget}
- Timeline: {timeline}

### Discovery Notes
{key insights from the conversation}
```

## OUTPUTS
- `output/startup-os-{date}.md` — session document with frontmatter
- Updated journey map showing Step 1 as complete

## SUCCESS METRICS
- User has articulated a clear primary metric
- User has identified their primary vertical
- Session document exists with populated frontmatter
- User feels heard and understood, not interrogated

## FAILURE MODES
- Asking too many questions without summarizing back
- Making assumptions about the business without confirming
- Skipping goal setting and jumping to tactics
- Creating a generic session document that could apply to any business
