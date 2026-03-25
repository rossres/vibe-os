# Step 2: Brand Brain

## MANDATORY EXECUTION RULES
- NEVER generate brand voice without user input — FACILITATE, don't create
- NEVER write to config/brand.yaml without user approval
- ALWAYS walk through the Narrative Framework step by step
- The customer is ALWAYS the hero. The product is ALWAYS the guide.

## DEPENDENCIES
- Step 1 (Session Setup) — uses business context and goals

## YOUR TASK
Build the brand configuration file (`config/brand.yaml`) through an interactive conversation. This file becomes the single source of truth that every agent, copywriter prompt, and landing page reads from.

## EXECUTION SEQUENCE

### Phase 1: Brand Voice

Walk the user through defining their brand voice:

1. **Tone** — "How do you want your brand to sound? Examples: business coach, trusted advisor, friendly expert, no-nonsense operator"
2. **Warmth** — "Low (clinical/professional), medium (approachable), or high (warm/personal)?"
3. **Directness** — "Low (diplomatic), medium (balanced), or high (straight talk)?"
4. **Style** — "Describe the vibe in one sentence. Example: 'Warm, direct, practical — talks like a friend who gets it.'"
5. **Vocabulary** — "What words should we ALWAYS use? What words should we NEVER use?"

Present the draft voice config for approval.

### Phase 2: Narrative Framework Framework

Walk through each element of the Narrative Framework:

1. **The Hero** — "Who is your customer? Describe them as a person, not a segment."
2. **What they want** — "What does this person desire? What are they trying to achieve?"
3. **The Problem**
   - External: "What tangible problems do they face?"
   - Internal: "How does this make them FEEL? What's the internal monologue?"
   - Philosophical: "What's unfair about their situation?"
4. **The Guide** — "How does your product show empathy? How does it show authority?"
5. **The Plan** — "What are the 3 simple steps to get started?"
6. **Failure** — "What happens if they don't act?"
7. **Success** — "What does life look like after? Separate wallet wins from heart wins."
8. **One-liner** — Draft 3 options, let the user pick or refine.
9. **CTA** — Primary (action) and secondary (softer).

Present the complete Narrative Framework config for approval.

### Phase 3: Canonical Narrative

Based on the Narrative Framework work, define the 5 immovable rules:
1. Hero statement
2. Core promise
3. Category
4. Core mechanism (channels/methods)
5. Emotional frame

These are the governance guardrails — nothing downstream can override them.

### Phase 4: Governance Rules

Help the user define:
- Rules that prevent messaging drift
- A validation checklist for all generated content
- Banned words and required phrases

### Phase 5: Write Config

Present the complete `config/brand.yaml` for final review. On approval:
1. Write to `config/brand.yaml`
2. Append the brand summary to the session document
3. Mark Step 2 as complete

## OUTPUTS
- `config/brand.yaml` — populated brand configuration
- Session document updated with brand summary
- Journey map updated

## SUCCESS METRICS
- Brand voice is distinct and specific (not generic marketing-speak)
- Narrative Framework is complete with all 7 elements
- Canonical narrative has 5 clear, immovable rules
- The user sees themselves and their customers in the output
- Config file passes schema validation

## FAILURE MODES
- Generating a generic brand voice that could apply to any company
- Skipping the Narrative Framework conversation and just asking for bullet points
- Making the product the hero instead of the customer
- Writing config without getting explicit user approval
- Using marketing jargon the user hasn't chosen
