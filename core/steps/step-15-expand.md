# Step 15: Expand

## MANDATORY EXECUTION RULES
- NEVER expand to new verticals without proving the current one works
- Shadow verticals need CEO approval before becoming primary
- New agents must have a charter amendment

## DEPENDENCIES
- Step 14 (Feedback Loop) — expansion decisions based on performance data

## YOUR TASK
Scale what's working. Add new verticals, channels, personas, or agents based on proven performance. This step can be repeated indefinitely as the business grows.

## EXECUTION SEQUENCE

### Phase 1: Expansion Readiness Assessment

Review current performance:
```
EXPANSION READINESS:

Primary vertical ({name}):
  - Conversion rate: {rate}
  - Customer acquisition cost: ${cpa}
  - Verdict: {ready/not ready} to expand

Shadow vertical ({name}):
  - Sample size: {n}
  - Early signals: {positive/negative/insufficient}
  - Verdict: {promote to primary / continue testing / drop}

System health:
  - Agents running daily: {count}/{total}
  - Content library: {count} pieces
  - Experiments completed: {count}
```

### Phase 2: Expansion Options

Present options based on the data:

1. **New vertical** — Promote shadow vertical to primary, or add a new one
   - Requires: New vertical config in `config/verticals.yaml`
   - Requires: Content generation (Step 8) for the new vertical
   - Requires: Charter amendment (vertical allocation update)

2. **New channel** — Add a platform not yet active
   - Requires: API credentials
   - Requires: Content in the right format
   - Requires: Campaign setup (Step 9)

3. **New persona** — Target a different buyer type
   - Requires: Persona definition in `config/personas.yaml`
   - Requires: Content generation for the new persona
   - Requires: Updated messaging framework

4. **New agent** — Activate an agent that wasn't in the initial roster
   - Requires: Charter amendment
   - Requires: Workflow scheduling update

5. **Scale existing** — Increase daily targets and budgets
   - Requires: Budget approval
   - Requires: Charter amendment with new targets

### Phase 3: Execute Expansion

For the chosen expansion:
1. Update config files (brand.yaml, verticals.yaml, personas.yaml)
2. Amend the charter if needed
3. Generate new content
4. Set up campaigns
5. Run the first batch
6. Add new experiments

### Phase 4: Reset Feedback Loop

After expansion:
1. Clear the re-run queue (old items may no longer apply)
2. Set new baseline metrics
3. Schedule the next feedback review (Step 14)

### Phase 5: Document

Append to session document:
- Expansion decision and rationale
- Config changes made
- New content generated
- New experiments launched
- Updated goals

## OUTPUTS
- Updated config files
- New content in database
- Charter amendments
- Session document updated
- Journey map shows Step 15 complete (but this step is repeatable)

## SUCCESS METRICS
- Expansion decision is data-driven (not gut feeling)
- Config changes are validated and approved
- New content is generated and reviewed
- New experiments are set up to measure the expansion
- The system can handle the increased scope

## FAILURE MODES
- Expanding before proving the current vertical works
- Not updating the charter to reflect new allocations
- Expanding into too many verticals at once (focus matters)
- Not setting up experiments for the new segments
