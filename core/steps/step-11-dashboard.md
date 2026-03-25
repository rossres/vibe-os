# Step 11: CEO Dashboard

## MANDATORY EXECUTION RULES
- The dashboard must show REAL data from the database — no mocks
- ALWAYS verify the database has records before launching
- The dashboard auto-refreshes — explain this to the user

## DEPENDENCIES
- Step 5 (System Charter) — goal tracking
- Steps 8-10 (at least some data in the system)

## YOUR TASK
Launch the CEO dashboard — a real-time web interface showing goal progress, today's numbers, agent health, experiments, escalations, and vertical performance.

## EXECUTION SEQUENCE

### Phase 1: Database Check

Verify the database has data to display:
- Accounts (from discovery)
- Content (from generation)
- Agent activity (from workflow runs)
- Charter and directives (from Step 5)

If empty, explain what data will appear once the engine runs.

### Phase 2: Launch Dashboard

Run the dashboard server:
```bash
pnpm dashboard
```

This starts a Hono server on `http://localhost:3333` with:
- **CEO view** (`/ceo`) — Goal progress, today's numbers, escalations, experiments, agent health
- **Operations view** (`/`) — Campaigns, content, signals, scoreboard
- **API** (`/api/dashboard`) — JSON endpoint for programmatic access

### Phase 3: Tour

Walk the user through each section:

1. **Goal Progress** — Shows the primary directive from the charter, current vs target, pace status
2. **Today's Numbers** — Outreach sent, replies, meetings, customers (today only)
3. **Escalations** — COO-flagged issues that need CEO decision
4. **Experiments** — Active A/B tests with variant performance
5. **Vertical Breakdown** — Performance metrics per vertical
6. **Agent Health** — Which agents ran today, which didn't

### Phase 4: Customize

Ask: "Want to adjust what's shown? The dashboard reads from the database — as agents produce data, it fills in automatically."

Options:
- Change the refresh interval (default: 30 seconds)
- Change the port (default: 3333)
- Add the dashboard to their startup script

### Phase 5: Document

Append to session document:
- Dashboard URL and port
- Sections overview
- How to access the API

## OUTPUTS
- Running dashboard on localhost:3333
- Session document updated

## SUCCESS METRICS
- Dashboard loads without errors
- Shows real data (or explains what will appear)
- User understands each section
- Auto-refresh is working
