# Step 6: Agent Roster

## MANDATORY EXECUTION RULES
- NEVER activate agents without a system charter (Step 5)
- ALWAYS use the business type from Step 1 to recommend the right team
- ALWAYS explain what each agent does before activating
- Start with the Phase I team — don't overwhelm with every possible agent

## DEPENDENCIES
- Step 1 (Session Setup) — business type determines the team
- Step 5 (System Charter) — agents read from the charter

## YOUR TASK
Activate and configure the Phase I agent team based on the business archetype from Step 1. Reference `core/archetypes.md` for the recommended team per business type.

## EXECUTION SEQUENCE

### Phase 1: Present the Recommended Team

Read `business_type` from the session document frontmatter. Present the archetype's recommended Phase I team:

**Example for B2B:**
```
Based on your B2B outbound business, here's your Phase I team:

  COCO (COO) — That's me. I coordinate the team, give you daily briefings,
  and escalate decisions. I'm always active.

  AI SDR — Finds prospects matching your ICP, enriches their data,
  scores them, and sends personalized outreach sequences.
  Requires: Google Places API key, email sending (Resend or Apollo)

  CONTENT DIRECTOR — Writes all your copy: cold emails, landing pages,
  ad copy, and social posts. Everything stays on brand.
  Requires: Anthropic API key (already set if you're running this)

  REVOPS — Tracks your pipeline daily. Conversion rates, reply rates,
  revenue by segment. Surfaces what's working and what's not.
  Requires: Data flowing through the system

Does this team feel right? Want to swap anyone out or add someone?
```

Adapt the presentation for each business type — use the language that matches:
- Consumer: "Growth Hacker" not "SDR", "downloads" not "pipeline"
- Marketplace: "Supply Recruiter" for the supply side
- SaaS: "Growth Lead" focused on activation, not outbound
- Local: "SDR" focused on geographic discovery

### Phase 2: Confirm & Adjust

The user can:
- **Accept the recommended team** — proceed with the archetype default
- **Swap an agent** — e.g., "I don't need an SDR, I need more focus on content"
- **Add an agent from Phase II early** — e.g., "I want the Growth Lead from day one"
- **Describe a custom need** — Coco recommends which agent fits

### Phase 3: API Key Check

For each activated agent, check dependencies:

```
PRE-FLIGHT CHECK:

  [x] Anthropic API key — set (required for all agents)
  [ ] Google Places API key — NOT SET (needed for AI SDR discovery)
  [ ] Resend API key — NOT SET (needed for email outreach)
  [x] Database — migrated and ready

Missing keys won't break anything — those agents just won't be able
to execute certain tasks until the keys are added.
```

Help the user add any missing keys to `.env`.

### Phase 4: Preview Phase II Superpowers

Show what's available to unlock later:

```
PHASE II SUPERPOWERS (unlock when you're ready):

  GROWTH LEAD — A/B experiments, conversion optimization
  → Coco will recommend this when you have enough data to test

  CREATIVE DIRECTOR — Visual brand, social images, ad creative
  → Unlock when you're ready to scale visual content

  {additional superpowers from archetype}
  → {when Coco recommends it}

You don't need to think about these now. I'll tell you when it's time.
```

### Phase 5: Document

Append to session document:
- Active agent roster with roles
- Any customizations
- Missing API keys and status
- Phase II superpowers available

## OUTPUTS
- Session document updated with agent roster
- Notes on which API keys still need to be set in `.env`

## SUCCESS METRICS
- Team matches the business type (not generic B2B for everyone)
- User understands what each agent does FOR THEIR BUSINESS
- Missing dependencies are identified, not blocking
- Phase II is previewed but not overwhelming

## FAILURE MODES
- Recommending the same team for every business type
- Not checking API keys before activating
- Overwhelming the user with all possible agents
- Using B2B language for a consumer app founder
