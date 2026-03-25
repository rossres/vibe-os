# Step 13: Experiments

## MANDATORY EXECUTION RULES
- Every experiment must have a HYPOTHESIS before it runs
- NEVER declare a winner without minimum sample size
- Experiments test ONE variable at a time

## DEPENDENCIES
- Step 8 (Content Engine) — need content variants to test
- Step 10 (Outreach) — need outreach running to measure

## YOUR TASK
Set up the experimentation framework — define your first A/B tests, create variants, and configure the evaluation criteria.

## EXECUTION SEQUENCE

### Phase 1: Experiment Strategy

Ask: "What's the first thing you want to test?"

Common first experiments:
```
SURFACE          WHAT TO TEST                    PRIMARY METRIC
Email subject    Pain-first vs benefit-first     Reply rate
Landing page     Hero copy variants              Conversion rate
CTA              Different primary CTAs           Click-through rate
Email body       Short vs long form              Reply rate
SMS              Different hooks                 Response rate
```

### Phase 2: Design First Experiment

For each experiment:
1. **Surface** — Where does the test run (email, landing page, SMS)
2. **Hypothesis** — "We believe [change] will [outcome] because [reason]"
3. **Primary metric** — The one number that determines the winner
4. **Minimum thresholds** — Sample size, send count, or spend before evaluation
5. **Vertical** — Which vertical this runs in

### Phase 3: Create Variants

For each experiment:
1. Generate variant A (control) and variant B (challenger) using the Content Director
2. Review both variants
3. Ensure they differ on ONLY the variable being tested
4. Store variants in `experiment_variants` table

### Phase 4: Launch

On approval:
1. Create experiment record in `experiments` table
2. Attach variants
3. Set status to "running"
4. Configure the outreach/landing page system to split traffic

### Phase 5: Explain Evaluation

Explain how experiments get evaluated:
- The Growth Lead daily workflow checks running experiments
- Winner is declared when:
  - Minimum thresholds are met
  - One variant has >1 percentage point better conversion rate
- Winning variant becomes the new default
- Losing variant is archived

### Phase 6: Document

Append to session document:
- Active experiments with hypotheses
- Variant descriptions
- Evaluation criteria
- Expected timeline to results

## OUTPUTS
- Experiment records in database
- Variant content linked
- Session document updated

## SUCCESS METRICS
- At least 1 experiment with a clear hypothesis
- Variants differ on exactly 1 variable
- Minimum thresholds are realistic for the traffic/volume
- User understands the evaluation process
