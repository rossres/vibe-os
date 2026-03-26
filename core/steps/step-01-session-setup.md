# Step 1: Session Setup

## MANDATORY EXECUTION RULES
- NEVER assume what the business does — ASK
- NEVER skip the business type question — the entire agent team depends on it
- NEVER skip the goal-setting conversation
- ALWAYS create the session document before proceeding

## YOUR TASK
Understand the user's business, goals, and timeline. Determine their business type so Coco can assemble the right team. Create the session document that will track progress through all steps.

## EXECUTION SEQUENCE

### Phase 1: Business Discovery

Have a conversation — don't interrogate. If they give you a website or docs, read them first.

1. **What does your business do?** — Get the one-sentence version.
2. **What kind of business is this?** — Determine the business type:

```
What kind of business are you building?

  1. B2B — selling to businesses (agencies, SaaS, services targeting companies)
  2. Consumer — selling to people (apps, DTC products, consumer services)
  3. Marketplace — connecting buyers and sellers (platforms, directories)
  4. SaaS — self-serve product with freemium or trial
  5. Local/Services — brick-and-mortar, consulting, agency, freelance
  6. Something else — tell me about it
```

NOTE: Many businesses are a blend (e.g., "B2B SaaS" or "local services marketplace"). That's fine — pick the PRIMARY motion and note the secondary. The agent team will be configured for the primary but Coco can unlock additional capabilities later.

3. **Who is your customer?** — Adapt based on business type:
   - B2B: Industries, company sizes, titles, buying process
   - Consumer: Demographics, psychographics, where they hang out
   - Marketplace: Both supply and demand side — who are the sellers? Who are the buyers?
   - SaaS: User persona, buyer persona (often different), self-serve vs sales-assisted
   - Local/Services: Geography, service area, customer type

4. **What's your primary go-to-market motion?**
   - B2B: Outbound, inbound, partner, events, content
   - Consumer: Social, influencer, paid, organic, community, referral, app store
   - Marketplace: Supply-first vs demand-first, chicken-and-egg strategy
   - SaaS: Product-led, sales-led, community-led
   - Local/Services: Referral, local SEO, Google Business, direct outreach

5. **What's working today?** — What channels or approaches are already producing results.
6. **What's not working?** — What they've tried that hasn't landed.
7. **What's the goal?** — Revenue target, customer count, user count, timeline.

### Phase 2: Team Recommendation

Based on the business type and go-to-market motion, recommend the Phase I agent team:

**B2B Outbound:**
```
Your Phase I team:
  - Coco (COO) — coordinates everything, your daily interface
  - AI SDR — discovers prospects, enriches data, sends outreach
  - Content Director — writes emails, ads, landing pages
  - RevOps — tracks pipeline metrics daily
Channels: cold email, LinkedIn, Google Ads, landing pages
```

**Consumer App / DTC:**
```
Your Phase I team:
  - Coco (COO) — coordinates everything, your daily interface
  - Growth Hacker — runs acquisition experiments, viral loops, referral programs
  - Content Creator — social content, ad creative, app store copy
  - Analytics Lead — tracks growth metrics, cohort analysis, retention
Channels: social (TikTok, Instagram, Twitter), paid social, app store, community
```

**Marketplace:**
```
Your Phase I team:
  - Coco (COO) — coordinates everything, your daily interface
  - Supply Recruiter — finds and onboards supply side (sellers, providers, hosts)
  - Content Director — landing pages, SEO content, email sequences
  - Growth Lead — runs experiments on both sides of the marketplace
Channels: outreach (supply side), SEO/content (demand side), referral, paid acquisition
```

**SaaS (Product-Led):**
```
Your Phase I team:
  - Coco (COO) — coordinates everything, your daily interface
  - Growth Lead — activation experiments, onboarding optimization, conversion
  - Content Director — SEO content, comparison pages, email nurture
  - Analytics Lead — funnel metrics, activation rates, churn signals
Channels: content/SEO, product experiments, email nurture, community, paid search
```

**Local / Services:**
```
Your Phase I team:
  - Coco (COO) — coordinates everything, your daily interface
  - AI SDR — finds local prospects, sends outreach
  - Content Director — Google Business posts, local landing pages, review requests
  - RevOps — tracks referrals, pipeline, close rates
Channels: Google Business, local SEO, referral, direct outreach, email
```

Ask: "Does this team feel right for your business? Want to adjust?"

### Phase 3: Goal Setting

Based on the discovery, help them articulate:
- **Primary metric** — the one number they're optimizing for
  - B2B: "50 customers in 30 days"
  - Consumer: "10,000 downloads in 60 days"
  - Marketplace: "200 sellers onboarded in 30 days"
  - SaaS: "500 trial signups, 50 conversions in 30 days"
  - Local: "20 new clients in 30 days"
- **Primary segment** — the market segment they're starting with (verticals for B2B, audience for consumer, supply category for marketplace)
- **Budget constraints** — what they can spend on ads, tools, outreach
- **Timeline** — when they need results by

### Phase 4: Create Session Document

Create the file `output/vibe-os-{date}.md` with:

```yaml
---
project_name: "{from conversation}"
business_type: "{b2b | consumer | marketplace | saas | local | custom}"
started_at: "{today's date}"
steps_completed: [1]
steps_skipped: []
rerun_queue: []
session_goals: "{primary metric}"
primary_segment: "{from conversation}"
target_customers: "{who they sell to}"
gtm_motion: "{primary go-to-market motion}"
phase1_agents: ["{agent1}", "{agent2}", "{agent3}", "{agent4}"]
phase1_channels: ["{channel1}", "{channel2}", "{channel3}"]
budget: "{from conversation}"
timeline: "{from conversation}"
---

# Vibe OS — {project_name}

## Step 1: Session Setup

### Business Summary
{one paragraph summary of the business}

### Business Type
{business_type} — {one sentence on why this type}

### Phase I Team
{agent roster with roles}

### Goals
- Primary metric: {metric}
- Primary segment: {segment}
- GTM motion: {motion}
- Budget: {budget}
- Timeline: {timeline}

### Discovery Notes
{key insights from the conversation}
```

## OUTPUTS
- `output/vibe-os-{date}.md` — session document with frontmatter
- Updated journey map showing Step 1 as complete
- Business type determines all downstream steps

## SUCCESS METRICS
- Business type is identified and confirmed
- Phase I agent team is recommended and approved
- User has articulated a clear primary metric
- User has identified their primary segment
- Session document exists with populated frontmatter
- User feels heard and understood, not interrogated

## FAILURE MODES
- Assuming B2B outbound for every business
- Asking too many questions without summarizing back
- Making assumptions about the business without confirming
- Skipping the team recommendation — the user should see who they're hiring
- Not adapting language to the business type (don't say "verticals" to a consumer app founder)
