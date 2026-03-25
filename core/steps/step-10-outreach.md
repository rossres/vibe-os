# Step 10: Outreach Activation

## MANDATORY EXECUTION RULES
- NEVER send live outreach without user approval on the first batch
- ALWAYS verify email sending is configured (Resend API key, from address)
- Check dedupe before every send — no double-contacting prospects

## DEPENDENCIES
- Step 5 (System Charter) — outreach limits and messaging rules
- Step 8 (Content Engine) — email templates to use
- Step 6 (Agent Roster) — AI SDR must be activated

## YOUR TASK
Activate the outreach pipeline. This connects the AI SDR agent to live sending — prospect discovery, enrichment, scoring, and email/SMS delivery.

## EXECUTION SEQUENCE

### Phase 1: Pre-flight Check

Verify all dependencies are in place:
- [ ] Resend API key configured in `.env`
- [ ] From email and name set
- [ ] Email templates generated (Step 8)
- [ ] Google Places API key (for discovery)
- [ ] Charter outreach limits defined
- [ ] CAN-SPAM compliance: physical address and unsubscribe URL in brand.yaml

Flag any missing items and help the user resolve them.

### Phase 2: Test Send

Before going live:
1. Pick 1 prospect from the discovery queue (or use a test email)
2. Show the exact email that would be sent
3. Send a test to the user's own email
4. Confirm it looks right

### Phase 3: Initial Batch

On approval:
1. Run the SDR discovery workflow for a small batch (10-20 prospects)
2. Show the enriched prospect list with scores
3. Show the outreach queue (who gets what email, when)
4. User approves → emails go out
5. Monitor delivery status

### Phase 4: Automate

Once the first batch is confirmed:
- Enable the daily SDR workflow (from Step 7 schedule)
- Set daily limits
- Configure dedupe lookback window (default: 14 days)

### Phase 5: Document

Append to session document:
- Outreach configuration
- First batch results
- Delivery statistics
- Automation status

## OUTPUTS
- Live outreach pipeline
- First batch sent and tracked
- Outreach events in database
- Session document updated

## SUCCESS METRICS
- Test email received and approved
- First batch sent without errors
- Dedupe working (no duplicates)
- CAN-SPAM compliant (address + unsubscribe)
- User confident in the automated pipeline

## FAILURE MODES
- Sending without CAN-SPAM compliance
- Not testing before going live
- Setting daily limits too high for the budget
- Not checking deliverability (SPF/DKIM)
