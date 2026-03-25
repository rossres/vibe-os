import "dotenv/config";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { ceoDashboard } from "./ceo-dashboard";
import { type DashboardData, getDashboardData } from "./queries.js";
import { landingPages } from "../landing-pages/routes.js";
import { getAuthUrl, handleCallback } from "../channels/google-ads/oauth.js";

const app = new Hono();

app.route("/ceo", ceoDashboard);
app.route("/lp", landingPages);

// Google Ads OAuth flow
app.get("/oauth/google-ads", (c) => {
	const url = getAuthUrl();
	return c.redirect(url);
});

app.get("/oauth/callback", async (c) => {
	const code = c.req.query("code");
	if (!code) return c.text("Missing code parameter", 400);
	await handleCallback(code);
	return c.html('<h1>Google Ads authorized!</h1><p>You can close this tab. <a href="/ceo">Back to dashboard</a></p>');
});

// Error handler
app.onError((err, c) => {
	console.error("Dashboard error:", err);
	return c.text(`Error: ${err.message}`, 500);
});

// API endpoint
app.get("/api/dashboard", async (c) => {
	const data = await getDashboardData();
	return c.json(data);
});

// Dashboard HTML
app.get("/", async (c) => {
	const data = await getDashboardData();
	return c.html(renderDashboard(data));
});

function renderDashboard(data: DashboardData): string {
	const { rightNow, doNext, scoreboard } = data;

	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Vibe OS</title>
	<meta http-equiv="refresh" content="30">
	<style>
		* { margin: 0; padding: 0; box-sizing: border-box; }
		body {
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
			background: #0a0a0a;
			color: #e5e5e5;
			min-height: 100vh;
			padding: 2rem;
		}
		.header {
			display: flex;
			align-items: baseline;
			gap: 1rem;
			margin-bottom: 2.5rem;
		}
		.header h1 {
			font-size: 1.5rem;
			font-weight: 700;
			color: #fff;
			letter-spacing: -0.02em;
		}
		.header .subtitle {
			font-size: 0.85rem;
			color: #666;
		}
		.grid {
			display: grid;
			grid-template-columns: 1fr 1fr;
			gap: 1.5rem;
			max-width: 1200px;
		}
		.card {
			background: #141414;
			border: 1px solid #222;
			border-radius: 12px;
			padding: 1.5rem;
		}
		.card-full { grid-column: 1 / -1; }
		.card h2 {
			font-size: 0.75rem;
			font-weight: 600;
			text-transform: uppercase;
			letter-spacing: 0.08em;
			color: #666;
			margin-bottom: 1rem;
		}
		.do-next { border-color: #2563eb; }
		.do-next h2 { color: #3b82f6; }

		/* Action items */
		.action {
			display: flex;
			gap: 1rem;
			padding: 0.75rem 0;
			border-bottom: 1px solid #1a1a1a;
		}
		.action:last-child { border-bottom: none; }
		.action-num {
			font-size: 1.25rem;
			font-weight: 700;
			color: #3b82f6;
			min-width: 2rem;
		}
		.action-text { font-size: 0.95rem; line-height: 1.5; }
		.action-reason { font-size: 0.8rem; color: #666; margin-top: 0.25rem; }
		.action-badge {
			display: inline-block;
			font-size: 0.65rem;
			font-weight: 600;
			text-transform: uppercase;
			letter-spacing: 0.05em;
			padding: 0.15rem 0.5rem;
			border-radius: 4px;
			background: #1e293b;
			color: #60a5fa;
			margin-top: 0.35rem;
		}

		/* List items */
		.item {
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: 0.5rem 0;
			border-bottom: 1px solid #1a1a1a;
			font-size: 0.9rem;
		}
		.item:last-child { border-bottom: none; }
		.item-name { color: #ccc; }
		.badge {
			display: inline-block;
			font-size: 0.7rem;
			font-weight: 600;
			padding: 0.2rem 0.6rem;
			border-radius: 100px;
		}
		.badge-active { background: #064e3b; color: #34d399; }
		.badge-draft { background: #1e293b; color: #94a3b8; }
		.badge-review { background: #422006; color: #fbbf24; }
		.badge-paused { background: #1c1917; color: #78716c; }

		/* Scoreboard */
		.stats {
			display: grid;
			grid-template-columns: repeat(3, 1fr);
			gap: 1rem;
		}
		.stat {
			text-align: center;
			padding: 1rem;
			background: #0a0a0a;
			border-radius: 8px;
		}
		.stat-value {
			font-size: 2rem;
			font-weight: 700;
			color: #fff;
			line-height: 1;
		}
		.stat-label {
			font-size: 0.75rem;
			color: #666;
			margin-top: 0.35rem;
		}

		/* Signals */
		.signal {
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: 0.4rem 0;
			border-bottom: 1px solid #1a1a1a;
			font-size: 0.85rem;
		}
		.signal:last-child { border-bottom: none; }
		.signal-type { color: #a78bfa; font-weight: 500; }
		.signal-account { color: #666; }
		.signal-time { color: #444; font-size: 0.75rem; }

		.empty { color: #444; font-style: italic; font-size: 0.85rem; padding: 1rem 0; }
	</style>
</head>
<body>
	<div class="header">
		<h1>Vibe OS</h1>
		<span class="subtitle">Auto-refreshes every 30s</span>
	</div>

	<div class="grid">
		<!-- DO NEXT -->
		<div class="card card-full do-next">
			<h2>Do Next</h2>
			${
				doNext.length === 0
					? '<div class="empty">All caught up. Run a signal scan or generate some content.</div>'
					: doNext
							.map(
								(item) => `
				<div class="action">
					<div class="action-num">${item.priority}</div>
					<div>
						<div class="action-text">${escapeHtml(item.action)}</div>
						<div class="action-reason">${escapeHtml(item.reason)}</div>
						<span class="action-badge">${escapeHtml(item.category)}</span>
					</div>
				</div>
			`,
							)
							.join("")
			}
		</div>

		<!-- SCOREBOARD -->
		<div class="card">
			<h2>Scoreboard</h2>
			<div class="stats">
				<div class="stat">
					<div class="stat-value">${scoreboard.totalAccounts}</div>
					<div class="stat-label">Accounts</div>
				</div>
				<div class="stat">
					<div class="stat-value">${scoreboard.totalSignals}</div>
					<div class="stat-label">Signals</div>
				</div>
				<div class="stat">
					<div class="stat-value">${scoreboard.contentThisWeek}</div>
					<div class="stat-label">Content This Week</div>
				</div>
			</div>
			${
				scoreboard.topVertical
					? `
			<div style="margin-top: 1rem; font-size: 0.85rem; color: #666;">
				Top vertical: <span style="color: #fff;">${escapeHtml(scoreboard.topVertical.vertical)}</span>
				(${scoreboard.topVertical.count} accounts)
			</div>`
					: ""
			}
			${
				scoreboard.accountsByStage.length > 0
					? `
			<div style="margin-top: 0.75rem;">
				${scoreboard.accountsByStage
					.map(
						(s) => `
					<span style="display: inline-block; margin-right: 1rem; font-size: 0.8rem;">
						<span style="color: #666;">${escapeHtml(s.stage ?? "none")}:</span>
						<span style="color: #fff;">${s.count}</span>
					</span>
				`,
					)
					.join("")}
			</div>`
					: ""
			}
		</div>

		<!-- RIGHT NOW: CAMPAIGNS -->
		<div class="card">
			<h2>Active Campaigns</h2>
			${
				rightNow.activeCampaigns.length === 0
					? '<div class="empty">No campaigns yet</div>'
					: rightNow.activeCampaigns
							.map(
								(c) => `
				<div class="item">
					<span class="item-name">${escapeHtml(c.name)}</span>
					<span>
						<span style="color: #666; font-size: 0.75rem; margin-right: 0.5rem;">${escapeHtml(c.platform)}</span>
						<span class="badge ${c.status === "active" ? "badge-active" : c.status === "paused" ? "badge-paused" : "badge-draft"}">${escapeHtml(c.status)}</span>
					</span>
				</div>
			`,
							)
							.join("")
			}
		</div>

		<!-- RIGHT NOW: CONTENT -->
		<div class="card">
			<h2>Pending Content</h2>
			${
				rightNow.pendingContent.length === 0
					? '<div class="empty">No content in draft or review</div>'
					: rightNow.pendingContent
							.map(
								(c) => `
				<div class="item">
					<span class="item-name">${escapeHtml(c.title ?? c.type)}</span>
					<span class="badge ${c.status === "review" ? "badge-review" : "badge-draft"}">${escapeHtml(c.status)}</span>
				</div>
			`,
							)
							.join("")
			}
		</div>

		<!-- RIGHT NOW: SIGNALS -->
		<div class="card card-full">
			<h2>Recent Signals (7 days)</h2>
			${
				rightNow.recentSignals.length === 0
					? '<div class="empty">No signals detected in the last 7 days. Run a signal scan.</div>'
					: rightNow.recentSignals
							.map(
								(s) => `
				<div class="signal">
					<span>
						<span class="signal-type">${escapeHtml(s.signalType)}</span>
						${s.accountName ? `<span class="signal-account"> — ${escapeHtml(s.accountName)}</span>` : ""}
					</span>
					<span>
						<span style="color: #666; font-size: 0.75rem; margin-right: 0.5rem;">${escapeHtml(s.source)}</span>
						<span class="signal-time">${formatTime(s.detectedAt)}</span>
					</span>
				</div>
			`,
							)
							.join("")
			}
		</div>
	</div>
</body>
</html>`;
}

function escapeHtml(text: string): string {
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

function formatTime(iso: string): string {
	const date = new Date(iso);
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
	const diffDays = Math.floor(diffHours / 24);

	if (diffDays > 0) return `${diffDays}d ago`;
	if (diffHours > 0) return `${diffHours}h ago`;
	const diffMins = Math.floor(diffMs / (1000 * 60));
	if (diffMins > 0) return `${diffMins}m ago`;
	return "just now";
}

// Start server
const port = Number(process.env.DASHBOARD_PORT || 3333);
serve({ fetch: app.fetch, port }, () => {
	console.log(`\n  Vibe OS Dashboard`);
	console.log(`  → http://localhost:${port}\n`);
});
