# Vibe OS — Business Archetypes

This file defines how Coco configures the agent team, channels, content strategy,
and metrics based on the business type identified in Step 1.

The infrastructure (database, dashboard, experiments, Coco) is universal.
What changes is the **team composition**, **channels**, and **playbook**.

---

## Archetype: B2B Outbound

**Best for:** Agencies, B2B SaaS with sales, professional services selling to businesses

### Phase I Agents
| Agent | Role | Mastra ID |
|-------|------|-----------|
| Coco | COO — coordinates team, daily briefings, escalations | ai-coo-lite |
| AI SDR | Prospect discovery, enrichment, outreach sequencing | ai-sdr |
| Content Director | Cold emails, landing pages, ad copy, case studies | content-director |
| RevOps | Pipeline metrics, conversion tracking, daily snapshots | revops |

### Channels
- Cold email (primary)
- LinkedIn (organic + ads)
- Google Search ads (high intent)
- Landing pages (per vertical)

### Content Types
- Cold email sequences (3-email per vertical x persona)
- Landing pages (per vertical)
- Google Ads copy
- LinkedIn posts
- Case studies / social proof

### Key Metrics
- Outreach sent, reply rate, meetings booked
- Pipeline value, conversion rate by stage
- Customer acquisition cost (CAC)
- Revenue per vertical

### Phase II Superpowers
- Growth Lead (A/B experiments)
- Creative Director (visual brand, social images)
- Google Ads automation
- Paid social (Meta, LinkedIn)
- Partner/referral program

---

## Archetype: Consumer App / DTC

**Best for:** Mobile apps, consumer products, DTC brands, creator businesses

### Phase I Agents
| Agent | Role | Mastra ID |
|-------|------|-----------|
| Coco | COO — coordinates team, daily briefings, escalations | ai-coo-lite |
| Growth Hacker | Acquisition experiments, viral loops, referral programs | growth-lead |
| Content Creator | Social content, ad creative, app store copy, community posts | content-director |
| Analytics Lead | Growth metrics, cohort analysis, retention curves | revops |

### Channels
- Social media (TikTok, Instagram, Twitter) — primary
- Paid social (Meta, TikTok ads)
- App store optimization (ASO)
- Community (Discord, Reddit, product communities)
- Influencer outreach
- Email (lifecycle, not cold)

### Content Types
- Social posts (platform-specific)
- Ad creative (video concepts, static ads)
- App store copy (title, subtitle, description, screenshots)
- Community posts and engagement
- Influencer briefs
- Lifecycle emails (onboarding, activation, retention)

### Key Metrics
- Downloads / signups
- Activation rate (% who complete key action)
- Day 1, Day 7, Day 30 retention
- Viral coefficient (K-factor)
- CAC by channel
- LTV:CAC ratio

### Phase II Superpowers
- Influencer Manager (outreach, tracking, ROI)
- Creative Director (video, visual brand)
- PR / press outreach
- Referral program automation
- Push notification optimization

---

## Archetype: Marketplace

**Best for:** Two-sided platforms, directories, booking platforms, gig economy

### Phase I Agents
| Agent | Role | Mastra ID |
|-------|------|-----------|
| Coco | COO — coordinates team, daily briefings, escalations | ai-coo-lite |
| Supply Recruiter | Finds and onboards supply side (sellers, providers, hosts) | ai-sdr |
| Content Director | Landing pages (both sides), SEO content, email sequences | content-director |
| Growth Lead | Experiments on both sides, referral loops, matching optimization | growth-lead |

### Channels
- Direct outreach to supply side (email, LinkedIn)
- SEO / content marketing (demand side)
- Referral programs (both sides)
- Paid search (demand side)
- Community building
- Partnerships

### Content Types
- Supply-side outreach sequences
- Supply-side onboarding guides
- Demand-side landing pages (by category)
- SEO blog posts (demand generation)
- Referral program copy
- Email lifecycle (both sides)

### Key Metrics
- Supply: providers onboarded, activation rate, listings created
- Demand: visitors, searches, bookings/transactions
- Liquidity: % of searches that result in a match
- Take rate, GMV, revenue
- Supply-demand ratio by category/geography

### Phase II Superpowers
- Demand Marketing Lead (paid acquisition, SEO scaling)
- Analytics Lead (marketplace dynamics, pricing optimization)
- Creative Director (brand, visual identity)
- Category expansion automation
- Geographic expansion playbook

---

## Archetype: SaaS (Product-Led)

**Best for:** Freemium products, self-serve SaaS, developer tools, productivity apps

### Phase I Agents
| Agent | Role | Mastra ID |
|-------|------|-----------|
| Coco | COO — coordinates team, daily briefings, escalations | ai-coo-lite |
| Growth Lead | Activation experiments, onboarding flows, conversion optimization | growth-lead |
| Content Director | SEO content, comparison pages, documentation, email nurture | content-director |
| Analytics Lead | Funnel metrics, activation rates, churn signals, cohorts | revops |

### Channels
- Content / SEO (primary — comparison pages, how-to guides)
- Product experiments (onboarding, activation, paywall)
- Email nurture (trial to paid, feature education)
- Community (forums, Slack/Discord, Product Hunt)
- Paid search (high-intent keywords)
- Social proof (G2, Capterra, reviews)

### Content Types
- SEO blog posts (problem-solution, comparison, how-to)
- Comparison/alternative pages (vs. competitors)
- Email nurture sequences (onboarding, activation, conversion)
- Product documentation
- Changelog / feature announcements
- Social proof collection (testimonials, case studies)

### Key Metrics
- Signups, trial starts
- Activation rate (% who reach "aha moment")
- Trial-to-paid conversion rate
- Time to value
- Monthly recurring revenue (MRR)
- Net revenue retention
- Churn rate

### Phase II Superpowers
- AI SDR (sales-assisted motion for enterprise leads)
- Creative Director (product videos, visual content)
- Developer Relations agent (docs, API guides, community)
- Partner/integration ecosystem
- Expansion revenue optimization

---

## Archetype: Local / Services

**Best for:** Brick-and-mortar, consultants, agencies, freelancers, home services

### Phase I Agents
| Agent | Role | Mastra ID |
|-------|------|-----------|
| Coco | COO — coordinates team, daily briefings, escalations | ai-coo-lite |
| AI SDR | Finds local prospects, sends outreach, follows up | ai-sdr |
| Content Director | Google Business posts, local pages, review requests, email | content-director |
| RevOps | Referral tracking, pipeline, close rates, revenue by service | revops |

### Channels
- Google Business Profile (primary — posts, reviews, Q&A)
- Local SEO (city pages, service pages)
- Direct outreach (email, door-to-door follow-up)
- Referral program
- Google Local Services / Maps ads
- Email (nurture, review requests)

### Content Types
- Google Business posts (weekly)
- Local landing pages (city x service)
- Review request sequences
- Cold outreach emails (local businesses)
- Referral program copy
- Service descriptions

### Key Metrics
- Leads generated (calls, form fills, messages)
- Close rate
- Revenue per client
- Google reviews (count and rating)
- Referral rate
- Geographic coverage

### Phase II Superpowers
- Growth Lead (A/B testing landing pages, ad copy)
- Creative Director (before/after photos, video testimonials)
- Reputation Manager (review monitoring, response automation)
- Multi-location expansion
- Paid local ads (Google LSA, Yelp, Nextdoor)

---

## How Coco Uses This

1. **Step 1** identifies the business type
2. **Step 6** (Agent Roster) uses this file to recommend the Phase I team
3. **Step 7** (Workflows) configures daily schedules based on the archetype's channels
4. **Step 8** (Content Engine) generates content types from the archetype
5. **Phase II superpowers** are recommended by Coco when metrics hit thresholds

The archetype is stored in the session document frontmatter (`business_type`) and referenced by all downstream steps.
