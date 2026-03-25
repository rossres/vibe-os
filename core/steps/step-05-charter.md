# Step 5: System Charter

## MANDATORY EXECUTION RULES
- The charter is the operating agreement for all agents — it must be precise
- NEVER set budget or targets without user approval
- The charter must define allowed claims AND forbidden claims

## DEPENDENCIES
- Steps 1-4 (Foundation) — uses business context, brand, verticals, personas, positioning

## YOUR TASK
Create the system charter — the structured document that tells every agent what to do, what not to do, and how to measure success. This gets stored in the database and is read by every agent at the start of every workflow.

## EXECUTION SEQUENCE

### Phase 1: Goals & OKRs

Define the CEO directive:
1. **Primary goal** — from Step 1 session goals (e.g., "50 customers in 30 days")
2. **Measurable target** — specific number
3. **Current value** — starting point (usually 0)
4. **Target value** — end point
5. **Timeline** — due date
6. **Owner agent** — who's primarily responsible (usually ai-sdr or growth-lead)

### Phase 2: Vertical Allocation

Based on Step 3 verticals:
1. **Primary vertical** — gets 80% of resources
2. **Shadow vertical** — gets 20%, used to test expansion
3. **Daily discovery target** — how many prospects per day
4. **Daily outreach limit** — max sends per day

### Phase 3: Messaging Rules

From Steps 2 and 4:
1. **Canonical positioning** — the one-liner
2. **Primary CTA** — from Narrative Framework
3. **Allowed claims** — what agents can say
4. **Forbidden claims** — what agents must never say
5. **Core mechanism** — channels/methods that must always be mentioned

### Phase 4: Budget

1. **Daily ad spend cap** — if running paid ads
2. **Monthly outreach budget** — email/SMS costs
3. **Tool budget** — API costs (Anthropic, enrichment, etc.)

### Phase 5: Write Charter

Run the System Setup Agent workflow to validate and persist the charter to the database:
- Execute `pnpm db:migrate` if not already done
- Write to `system_charter` table
- Write CEO directive to `ceo_directives` table

### Phase 6: Document

Append charter summary to session document.

## OUTPUTS
- Database: `system_charter` record (active)
- Database: `ceo_directives` record (primary goal)
- Session document updated with charter summary

## SUCCESS METRICS
- Charter has a clear primary goal with measurable target
- Vertical allocation adds up to 100%
- Messaging rules include both allowed and forbidden claims
- Budget is defined (even if $0 for organic-only)
- Charter passes validation and is stored in the database
