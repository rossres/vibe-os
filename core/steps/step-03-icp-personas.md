# Step 3: ICP & Personas

## MANDATORY EXECUTION RULES
- NEVER invent persona details — all data comes from the user
- ALWAYS define at least a primary persona before proceeding
- Personas must include pain points, decision factors, and communication style

## DEPENDENCIES
- Step 2 (Brand Brain) — uses brand voice and Narrative Framework hero definition

## YOUR TASK
Define the ideal customer profile (ICP) and 2-3 buyer personas. These drive all targeting, copy personalization, and outreach sequencing.

## EXECUTION SEQUENCE

### Phase 1: Vertical Definition

1. **List verticals** — "What market segments do you serve? List them all."
2. **Prioritize** — "Which verticals are highest priority? Let's rank them into Tier A (top 3-5), Tier B (next 5), and Tier C (exploratory)."
3. **For each Tier A vertical**, gather:
   - Display name (human-readable)
   - Top 3 pain points specific to this vertical
   - Demo hook (the one-sentence "aha" moment)
   - Revenue per missed interaction (what it costs them to not use you)
   - Key features ranked by importance for this vertical
   - Language substitutions (e.g., "customer" → "patient" for medical)
   - Tone: professional or standard

Write `config/verticals.yaml` with the vertical data.

### Phase 2: Persona Definition

For each persona (aim for 2-3):

1. **Name** — Give them a real first name (easier to reference)
2. **Description** — One paragraph: who they are, what their day looks like
3. **Role** — Primary buyer, secondary buyer, or influencer
4. **Company size** — Employee range and revenue range
5. **Pain points** — Top 3 specific to this persona (not the vertical)
6. **Communication style** — How they prefer to be talked to
7. **Decision factors** — What makes them say yes or no

Present each persona for review before moving to the next.

Write `config/personas.yaml` with persona data.

### Phase 3: Update Brand Config

Add the vertical tiers and persona slugs to `config/brand.yaml`:

```yaml
verticals:
  tier_a: [vertical-1, vertical-2, vertical-3]
  tier_b: [vertical-4, vertical-5]
  tier_c: [vertical-6]

personas:
  primary: "persona-name"
  secondary: "persona-name"
  influencer: "persona-name"
```

### Phase 4: Document

Append to session document:
- Vertical priority list with tier assignments
- Full persona profiles
- ICP summary

## OUTPUTS
- `config/verticals.yaml` — vertical definitions
- `config/personas.yaml` — persona definitions
- `config/brand.yaml` — updated with vertical tiers and persona slugs
- Session document updated

## SUCCESS METRICS
- At least 1 Tier A vertical with full detail
- At least 1 persona with all fields populated
- Verticals have specific pain points (not generic)
- Personas feel like real people, not market segments
- Config files pass schema validation

## FAILURE MODES
- Creating generic personas ("busy professional who wants to save time")
- Inventing vertical pain points without asking the user
- Skipping revenue-per-missed-interaction — this drives all copy
- Not ranking features by importance for the vertical
