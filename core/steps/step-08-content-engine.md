# Step 8: Content Engine

## MANDATORY EXECUTION RULES
- ALL generated content must pass governance validation before approval
- NEVER publish content without user review on the first run
- Content must hit BOTH heart benefits AND wallet benefits

## DEPENDENCIES
- Step 2 (Brand Brain) — content reads from brand.yaml
- Step 5 (System Charter) — content respects allowed/forbidden claims

## YOUR TASK
Generate the first batch of content across your priority verticals and personas. This populates the content library that the SDR and campaigns use for outreach.

## EXECUTION SEQUENCE

### Phase 1: Content Plan

Based on the charter and config, propose a content generation plan:

```
CONTENT GENERATION PLAN:

Verticals: {tier_a verticals from config}
Personas: {primary, secondary from config}
Stages: identified, aware, interested

Content Types:
  - Cold email sequences (3-email per vertical x persona)
  - Landing page copy (1 per vertical)
  - Ad copy (Google + Meta per vertical)

Estimated generations: {count}
Estimated cost: ~${estimated_api_cost}
```

Ask: "Does this plan look right? Want to adjust scope?"

### Phase 2: Generate

For each combination in the plan:
1. Call the Copywriter Service with the vertical, persona, and stage
2. Show a sample of the generated content
3. Run governance validation
4. Flag any failures for user review

### Phase 3: Review & Approve

Present generated content grouped by type:
- Show validation status (pass/review/fail)
- Let user approve, reject, or request revisions
- Store approved content in the `content` table
- Save files to `output/{type}/{date}/`

### Phase 4: Document

Append to session document:
- Content generated (count by type)
- Validation results
- Any content flagged for review

## OUTPUTS
- Content records in database (`content` table)
- Generated files in `output/` directory
- Session document updated

## SUCCESS METRICS
- At least 1 complete email sequence per Tier A vertical
- All content passes governance validation
- Content uses vertical-specific language (not generic)
- Heart + wallet benefits paired in every piece

## FAILURE MODES
- Generating content that positions the product as the hero
- Using banned vocabulary
- Creating generic content that ignores vertical specifics
- Generating more content than the user can review
