# Step 14: Feedback Loop

## MANDATORY EXECUTION RULES
- ALL recommendations must cite the data that triggered them
- NEVER change ICP weights without explaining why
- The re-run queue feeds back into Steps 8 and 13

## DEPENDENCIES
- Step 12 (Analytics) — needs data to analyze
- Step 13 (Experiments) — needs experiment results

## YOUR TASK
Close the optimization loop. Analyze performance data, update ICP scoring weights, identify underperforming segments, and populate the re-run queue for content regeneration and new experiments.

## EXECUTION SEQUENCE

### Phase 1: Performance Review

Pull data from the database and present:

```
PERFORMANCE SUMMARY (last 7 days):

By Segment:
  segment-a:  50 sent, 8 replies, 2 meetings (16% reply rate)
  segment-b:  45 sent, 3 replies, 0 meetings (6.7% reply rate)
  segment-c:  30 sent, 5 replies, 1 meeting (16.7% reply rate)

By Content Type:
  cold_email: 125 sent, 16 replies (12.8% reply rate)
  landing_page: 340 views, 12 conversions (3.5% CVR)

By Persona:
  primary:    80 sent, 12 replies (15%)
  secondary:  45 sent, 4 replies (8.9%)

Experiments:
  email_subject_test: Variant B winning (18% vs 11%), needs 40 more sends
```

### Phase 2: Diagnosis

For each underperforming segment, diagnose:
1. **What's happening** — the data point
2. **Why it might be happening** — possible causes
3. **What to do about it** — specific action

Example:
- "Segment B reply rate is 6.7% vs 16% for Segment A. Possible cause: email copy doesn't match this segment's pain points. Recommendation: regenerate Segment B emails with more targeted framing."

### Phase 3: ICP Weight Updates

Based on conversion data, adjust ICP scoring weights:
- Verticals with higher conversion get higher weights
- Signal types that predict conversion get higher weights
- Present changes for user approval before applying

### Phase 4: Re-run Queue

For each recommended action, add to the re-run queue:

```yaml
rerun_queue:
  - step: 8
    scope: "segment-b x primary — 3 new email variants with targeted framing"
    reason: "Segment B reply rate 6.7% vs 16% average"
    added: "{today}"
  - step: 13
    scope: "New experiment: long-form vs short-form for segment-c"
    reason: "Segment C shows promise but small sample"
    added: "{today}"
```

### Phase 5: Document

Append to session document:
- Performance summary
- Diagnoses and recommendations
- ICP weight changes
- Re-run queue items

## OUTPUTS
- Updated ICP weights in database
- Re-run queue populated in session document
- Feedback log in `output/analytics/`
- Session document updated

## SUCCESS METRICS
- Every recommendation cites specific data
- ICP weight changes are justified and approved
- Re-run queue items have clear scope and reason
- The loop is closed — data leads to action leads to measurement

## FAILURE MODES
- Making changes based on insufficient sample sizes
- Changing ICP weights without user approval
- Generic recommendations ("do better") instead of specific actions
- Not connecting back to Steps 8 and 13
