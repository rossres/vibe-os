# Step 12: Analytics

## MANDATORY EXECUTION RULES
- NEVER assume analytics sources — ask what the user has
- Data can be imported via API, CSV, or manual entry
- Analytics must map to the funnel stages defined in the charter

## DEPENDENCIES
- Step 5 (System Charter) — defines what metrics matter
- Step 11 (Dashboard) — analytics feed the dashboard

## YOUR TASK
Connect external analytics sources to the engine so the RevOps agent can snapshot metrics and the feedback loop can optimize performance.

## EXECUTION SEQUENCE

### Phase 1: Source Inventory

Ask: "What analytics tools do you currently use?"

Common sources and their integration method:
```
SOURCE                  METHOD        WHAT IT PROVIDES
PostHog                 API           Product analytics, funnels, retention
Google Analytics (GA4)  API           Traffic, conversions, attribution
Google Ads              API/CSV       Campaign spend, clicks, conversions
Meta Ads                API/CSV       Campaign performance
LinkedIn Ads            API/CSV       Campaign performance
Resend                  Built-in      Email opens, clicks, bounces
Google Places           Built-in      Review monitoring, competitor signals
```

### Phase 2: Configure Connections

For each source the user has:
1. Check if the API key is set in `.env`
2. If not, guide them through getting the key
3. Test the connection with a simple API call
4. Confirm data is flowing

For sources without API access:
- Set up CSV import workflow
- Or configure manual entry in the dashboard

### Phase 3: Attribution Setup

Define how touchpoints map to conversions:
- What counts as a "conversion" (signup, demo, purchase)
- Which channels get credit (first-touch, last-touch, multi-touch)
- How to track across channels

### Phase 4: First Snapshot

Run the analytics snapshot workflow manually:
1. Pull data from connected sources
2. Store in `analytics_snapshots` table
3. Show the results on the dashboard
4. Verify numbers make sense

### Phase 5: Document

Append to session document:
- Connected analytics sources
- Missing sources to add later
- Attribution model
- First snapshot results

## OUTPUTS
- Connected analytics integrations
- First data snapshot in database
- Session document updated

## SUCCESS METRICS
- At least 1 analytics source connected
- Data appears in the dashboard
- Attribution model is defined
- User knows how to add more sources later
