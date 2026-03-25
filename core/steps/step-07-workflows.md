# Step 7: Workflows & Scheduling

## MANDATORY EXECUTION RULES
- NEVER start cron jobs without user confirmation
- ALWAYS show the schedule before activating
- Daily targets must align with the charter budget

## DEPENDENCIES
- Step 5 (System Charter) — workflows read goals and budgets from charter
- Step 6 (Agent Roster) — only schedule workflows for active agents

## YOUR TASK
Configure the daily workflow schedule — what runs, when, and with what parameters. This is the cron schedule that makes the engine autonomous.

## EXECUTION SEQUENCE

### Phase 1: Review Default Schedule

Present the default daily schedule:

```
DAILY WORKFLOW SCHEDULE:

  07:00  Content Director — Generate missing content templates
  08:00  AI SDR — Discover, Enrich, Score, Outreach
  12:00  RevOps — Snapshot daily metrics
  15:00  Experiment Evaluator — Analyze running tests
  16:00  Growth Lead — Create/monitor experiments
  17:00  AI COO — Enforce goals, escalate issues
```

Ask: "Does this schedule work for your timezone and workflow? Want to adjust any times?"

### Phase 2: Configure Parameters

For each active workflow, set key parameters:

**SDR Daily:**
- Daily discovery target (default: 50 accounts)
- Daily outreach limit (default: from charter)
- Discovery sources (Google Places, manual import)

**Content Daily:**
- Which personas to generate for (from config)
- Which content types to prioritize (cold_email, landing_page, ad_copy)
- How many variants per combination

**COO Daily:**
- Which agents to monitor (from Step 6 roster)
- Escalation thresholds
- Activity-without-results detection window (default: 3 days)

### Phase 3: Activate

On user confirmation:
1. Show the final schedule one more time
2. Explain: "These run automatically when you start the engine with `pnpm dev`"
3. Note: The scheduler uses `node-cron` — runs in-process, no external cron needed

### Phase 4: Document

Append to session document:
- Final schedule with times and parameters
- Per-workflow configuration
- How to start/stop the engine

## OUTPUTS
- Session document updated with workflow schedule
- Parameters documented for each workflow

## SUCCESS METRICS
- Schedule aligns with user's timezone
- Daily targets align with charter budget
- Only active agents have scheduled workflows
- User understands how to start and stop the engine

## FAILURE MODES
- Setting discovery/outreach targets that exceed budget
- Scheduling workflows for agents that aren't activated
- Not explaining how the cron system works
