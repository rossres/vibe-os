# Vibe OS

**Meet Coco — your AI COO.**

You have an idea. Maybe you have a product. What you don't have is a marketing team, a sales team, a COO, or 80 hours a week to do it all yourself.

Vibe OS gives you Coco — an AI chief operating officer who sets up your business, runs your go-to-market, and reports back to you every day. Not a chatbot. Not a template. A full operating system with agents that discover prospects, write copy, send outreach, run experiments, and learn what works.

Drop this repo into [Claude Code](https://claude.ai/claude-code). Coco takes it from there.

---

## What You Get

**Coco coordinates a team of AI agents that work while you sleep:**

| Agent | What It Does |
|-------|-------------|
| **Coco (COO)** | Your primary interface. Coordinates the team, enforces goals, escalates decisions to you |
| **AI SDR** | Finds prospects, enriches their data, scores them, and sends outreach |
| **Content Director** | Writes your emails, ads, landing pages, and social — on brand, every time |
| **Growth Lead** | Designs and runs A/B experiments to find what actually works |
| **RevOps** | Tracks performance across verticals and channels daily |

**Plus the infrastructure to run it all:**

- 45-table database (accounts, campaigns, experiments, content, agent tasks)
- CEO dashboard with real-time goal tracking, escalations, and agent health
- Cron-scheduled daily workflows (discovery at 8am, content at 7am, Coco's review at 5pm)
- Narrative Framework-driven copy generation with governance validation
- A/B experiment framework with automated winner detection
- Multi-channel outreach (email, SMS, landing pages, ads)

---

## How It Works

### 1. Drop it in Claude Code

```bash
git clone https://github.com/rossres/vibe-os.git
cd vibe-os
pnpm install
```

Open it in [Claude Code](https://claude.ai/claude-code).

### 2. Coco sets you up

Coco walks you through onboarding — your brand, your customers, your positioning, your goals. By the end, you have a fully configured system with agents ready to run.

```
PHASE 1: FOUNDATION          Coco learns your business, brand, customers, positioning
PHASE 2: AGENT SETUP         Coco configures your AI team and daily workflows
PHASE 3: GO-TO-MARKET        First content, campaigns, and outreach go live
PHASE 4: OPERATIONS           Dashboard is live, analytics connected
```

### 3. Coco runs your business

Once setup is done, Coco becomes your ongoing interface. Your agents run on a daily schedule:

```
07:00  Content Director generates missing templates
08:00  AI SDR discovers, enriches, and reaches out to prospects
12:00  RevOps snapshots daily metrics
15:00  Experiments get evaluated
16:00  Growth Lead designs new tests
17:00  Coco reviews everything, escalates issues to you
```

You talk to Coco. Coco talks to the team. You make decisions on escalations. The system learns and adapts.

### 4. Unlock superpowers

As your business grows, Coco recommends new capabilities:

- **Experiments** — "Your med-spa outreach is converting at 16%. Ready to A/B test subject lines?"
- **New verticals** — "HVAC is showing early promise. Want to promote it from shadow to primary?"
- **New channels** — "Email is working. Ready to add Google Ads?"
- **New agents** — "You need a Creative Director. Want to activate one?"

Each superpower is unlocked when the data says you're ready — not before.

---

## Who This Is For

You're a founder. Maybe a solo operator. Maybe you have a small team. You're trying to figure out who your customer is, what to say to them, and how to get in front of them — all at the same time.

You don't need another course. You don't need a 47-page marketing plan. You need Coco.

**Vibe OS is for you if:**
- You're launching something and need to go from zero to customers
- You know your product but haven't nailed your messaging yet
- You're doing everything manually and it's not scaling
- You want AI to do the repetitive work so you can focus on the hard stuff
- You believe in building in public and learning fast

**This is NOT for you if:**
- You want a magic button that prints money
- You're not willing to think about who your customer actually is
- You need enterprise-grade marketing automation (use HubSpot)

---

## Quick Start (Skip the Guided Flow)

If you already know what you're doing:

```bash
# 1. Copy and fill in your brand config
cp config/brand.example.yaml config/brand.yaml
# Edit config/brand.yaml with your business details

# 2. Set up environment
cp .env.example .env
# Add your ANTHROPIC_API_KEY at minimum

# 3. Set up the database
pnpm db:migrate

# 4. Start the engine
pnpm dev

# 5. Open the CEO dashboard
pnpm dashboard
# → http://localhost:3333
```

---

## The Stack

| Layer | Tech |
|-------|------|
| AI | Claude (Anthropic SDK) |
| Agent orchestration | Mastra |
| Database | SQLite + Drizzle ORM |
| Web dashboard | Hono |
| Email | Resend |
| Scheduling | node-cron |
| Validation | Zod |
| Language | TypeScript |

Everything runs locally. No external services required except Claude (and optionally Google Places, Resend, and ad platforms if you want those channels).

---

## Project Structure

```
vibe-os/
├── core/                     # Coco's onboarding framework
│   ├── facilitator.md        # Entry point — Coco's setup mode
│   ├── template.md           # Session document skeleton
│   └── steps/                # 15 interactive step files
├── config/                   # Your business configuration
│   ├── brand.example.yaml    # Template — copy and fill in
│   └── platforms.yaml        # API credential config
├── src/                      # The engine
│   ├── brain/                # Brand knowledge service
│   ├── copywriter/           # Claude-powered content generation
│   ├── radar/                # Lead discovery and scoring
│   ├── enricher/             # Prospect data enrichment
│   ├── campaigns/            # Campaign management
│   ├── publisher/            # Content publishing
│   ├── creative/             # Creative asset specs
│   ├── analytics/            # Multi-platform analytics
│   ├── loop/                 # Feedback and optimization
│   ├── mastra/               # Agent definitions, workflows, tools
│   │   ├── agents/           # AI agents (Coco + team)
│   │   ├── workflows/        # Daily workflows
│   │   └── tools/            # Shared agent tools
│   └── dashboard/            # CEO dashboard (Hono web server)
├── tests/                    # Test suite
├── docs/examples/            # Example configs (sample business reference)
└── output/                   # Generated content (gitignored)
```

---

## The Philosophy

### Your customer is the hero. Your product is the guide.

Every piece of copy this system generates follows the the hero/guide narrative framework. Your customer is the hero of the story. Your product helps them win. Not the other way around.

### Config over code.

All your business-specific data lives in YAML config files, not hardcoded in source code. Change your brand voice, add a vertical, update your pricing — it's a config change, not a code change.

### Coco enforces, not just executes.

Coco doesn't just run workflows. Coco detects when agents are busy but not producing results. Coco escalates when experiments stall. Coco enforces the charter you defined. It's the accountability layer most AI systems are missing.

### Build in public. Ship fast. Learn faster.

This isn't a finished product. It's an operating system you customize for your business. Fork it, break it, make it better. The feedback loop is built in — literally. Coco analyzes what's working and tells you what to change.

---

## Contributing

This is an open-source project. Contributions welcome.

**Ways to contribute:**
- Add new agent types (customer success, product, finance)
- Add new content types (video scripts, podcast outlines, PR pitches)
- Add new analytics connectors
- Improve the onboarding steps with better facilitation prompts
- Add new vertical templates to the examples
- Build integrations (Stripe, Calendly, CRM systems)
- Write about how you used Vibe OS to launch your business

**To contribute:**
1. Fork the repo
2. Create a branch (`git checkout -b feature/your-feature`)
3. Make your changes
4. Open a PR with a description of what you did and why

---

## Examples

The `docs/examples/sample-business/` directory contains a complete working example from a real business (an AI front desk for local businesses). It shows:

- A fully populated `brand.yaml` with Narrative Framework
- 12 vertical templates with pain points, features, and language
- 3 buyer personas
- Pricing tiers with ROI framing
- Competitive positioning with only-we statements

Use it as a reference for how detailed your own config should be.

---

## FAQ

**Do I need to know how to code?**
No. Coco walks you through everything. You're making decisions about your business, not writing code. If you want to customize agents or add features, that's TypeScript — but it's not required.

**How much does it cost to run?**
The only required paid service is Claude (Anthropic API). Content generation costs roughly $0.01-0.05 per piece. A full setup session might cost $1-5 in API calls. Daily operations cost pennies.

**Can I use this with GPT/Gemini/other models?**
The engine is built on the Anthropic SDK. You'd need to swap out the Copywriter service to use a different model. The agent orchestration (Mastra) supports multiple providers.

**Is this production-ready?**
It's production-ready for a startup. The database is SQLite (local), the dashboard runs on localhost, and outreach goes through Resend. If you need multi-user, hosted, or enterprise-scale — you'll need to build on top of this.

**What's the difference between this and just using Claude directly?**
Claude is one brain. Vibe OS is Coco plus a team of specialized agents, running on a schedule, with a database tracking everything, experiments optimizing performance, and a dashboard showing you what's happening. It's the difference between having a smart friend and having a team.

---

## License

MIT — do whatever you want with it. Build your business. Make it better. Share what you learn.

---

*Built by [Ross Resnick](https://github.com/rossres). If Coco helps you launch something, tell me about it.*
