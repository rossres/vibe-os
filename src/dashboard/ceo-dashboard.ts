import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { getDb } from "../core/db";
import { agentTasks } from "../core/db/schema";
import {
	getActiveExperiments,
	getAgentHealth,
	getCooActions,
	getEscalations,
	getGoalProgress,
	getLinkedInTeeUps,
	getTodayNumbers,
	getVerticalBreakdown,
} from "./ceo-queries";
import { aiCooLite } from "../mastra/agents/ai-coo-lite";
import { contentDirectorAgent } from "../mastra/agents/content-director";
import { aiSdrAgent } from "../mastra/agents/ai-sdr";
import { revOpsAgent } from "../mastra/agents/revops";
import { growthLeadAgent } from "../mastra/agents/growth-lead";
import { creativeDirectorAgent } from "../mastra/agents/creative-director";
import { cpoAgent } from "../mastra/agents/cpo";
import { setupAgent } from "../mastra/agents/setup-agent";
import type { Agent } from "@mastra/core/agent";

const agentMap: Record<string, Agent> = {
	"ai-coo-lite": aiCooLite,
	"content-director": contentDirectorAgent,
	"creative-director": creativeDirectorAgent,
	"cpo": cpoAgent,
	"ai-sdr": aiSdrAgent,
	"revops": revOpsAgent,
	"growth-lead": growthLeadAgent,
	"setup-agent": setupAgent,
};

export const ceoDashboard = new Hono();

const statusEmoji: Record<string, string> = {
	on_track: "🟢",
	behind: "🟡",
	ahead: "🟢",
	at_risk: "🔴",
	no_goal: "⚪",
};

function progressBar(pct: number): string {
	const filled = Math.round(pct / 5);
	return "█".repeat(Math.min(filled, 20)) + "░".repeat(Math.max(20 - filled, 0));
}

const CSS = `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, system-ui, sans-serif; background: #0a0a0a; color: #e5e5e5; padding: 20px; max-width: 800px; margin: 0 auto; }
    h1 { font-size: 1.5rem; margin-bottom: 4px; }
    .date { color: #888; margin-bottom: 24px; }
    .section { background: #1a1a1a; border-radius: 8px; padding: 16px; margin-bottom: 16px; }
    .section h2 { font-size: 1.1rem; margin-bottom: 12px; color: #fff; }
    .progress { font-family: monospace; font-size: 1.2rem; color: #4ade80; }
    .metric { display: inline-block; margin-right: 24px; margin-bottom: 8px; }
    .metric-value { font-size: 1.5rem; font-weight: bold; color: #fff; }
    .metric-label { font-size: 0.8rem; color: #888; }
    .agent-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #222; }
    .agent-status { font-weight: bold; }
    .ok { color: #4ade80; }
    .fail { color: #f87171; }
    .escalation { background: #1c1917; border-left: 3px solid #f59e0b; padding: 12px; margin-bottom: 8px; border-radius: 4px; }
    .btn { background: #2563eb; color: white; border: none; padding: 6px 16px; border-radius: 4px; cursor: pointer; margin-right: 8px; font-size: 0.85rem; }
    .btn:hover { background: #1d4ed8; }
    .btn-reject { background: #dc2626; }
    .btn-reject:hover { background: #b91c1c; }
    .exp-card { background: #111; padding: 12px; border-radius: 4px; margin-bottom: 8px; }
    .action-item { padding: 4px 0; color: #d4d4d4; }

    /* Chat drawer */
    .chat-toggle {
        position: fixed; bottom: 24px; right: 24px; width: 56px; height: 56px;
        border-radius: 50%; background: #2563eb; border: none; cursor: pointer;
        color: white; font-size: 1.5rem; display: flex; align-items: center; justify-content: center;
        box-shadow: 0 4px 12px rgba(37,99,235,0.4); z-index: 1000; transition: transform 0.15s;
    }
    .chat-toggle:hover { transform: scale(1.08); }
    .chat-drawer {
        position: fixed; bottom: 92px; right: 24px; width: 420px; max-height: 520px;
        background: #141414; border: 1px solid #333; border-radius: 12px;
        display: none; flex-direction: column; z-index: 1000;
        box-shadow: 0 8px 32px rgba(0,0,0,0.6);
    }
    .chat-drawer.open { display: flex; }
    .chat-header {
        padding: 12px 16px; border-bottom: 1px solid #222;
        display: flex; align-items: center; justify-content: space-between;
    }
    .chat-header h3 { font-size: 0.9rem; color: #fff; }
    .chat-header .chat-close { background: none; border: none; color: #666; cursor: pointer; font-size: 1.2rem; }
    .agent-tabs {
        display: flex; gap: 4px; padding: 8px 12px; overflow-x: auto;
        border-bottom: 1px solid #222; flex-shrink: 0;
    }
    .agent-tab {
        padding: 4px 10px; border-radius: 6px; border: 1px solid #333;
        background: #0a0a0a; color: #888; cursor: pointer; font-size: 0.75rem;
        white-space: nowrap; transition: all 0.15s;
    }
    .agent-tab:hover { border-color: #555; color: #ccc; }
    .agent-tab.active { background: #2563eb; border-color: #2563eb; color: #fff; }
    .chat-messages {
        flex: 1; overflow-y: auto; padding: 12px 16px;
        display: flex; flex-direction: column; gap: 8px;
        min-height: 200px; max-height: 340px;
    }
    .chat-msg {
        max-width: 85%; padding: 8px 12px; border-radius: 8px;
        font-size: 0.85rem; line-height: 1.45; word-wrap: break-word; white-space: pre-wrap;
    }
    .chat-msg.user { align-self: flex-end; background: #2563eb; color: #fff; }
    .chat-msg.agent { align-self: flex-start; background: #1e1e1e; color: #e5e5e5; }
    .chat-msg.error { align-self: flex-start; background: #2d1515; color: #f87171; }
    .chat-msg.thinking { align-self: flex-start; background: #1e1e1e; color: #666; font-style: italic; }
    .chat-input-row {
        display: flex; gap: 8px; padding: 12px; border-top: 1px solid #222;
    }
    .chat-input-row input {
        flex: 1; background: #0a0a0a; border: 1px solid #333; border-radius: 6px;
        padding: 8px 12px; color: #e5e5e5; font-size: 0.85rem; outline: none;
    }
    .chat-input-row input:focus { border-color: #2563eb; }
    .chat-input-row button {
        background: #2563eb; border: none; color: white; padding: 8px 16px;
        border-radius: 6px; cursor: pointer; font-size: 0.85rem;
    }
    .chat-input-row button:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const AGENTS = [
	{ id: "ai-coo-lite", label: "COO" },
	{ id: "content-director", label: "Content" },
	{ id: "ai-sdr", label: "SDR" },
	{ id: "revops", label: "RevOps" },
	{ id: "growth-lead", label: "Growth" },
	{ id: "setup-agent", label: "System Setup" },
];

const CHAT_HTML = `
<button class="chat-toggle" onclick="toggleChat()" title="Chat with your agents">&#x1f4ac;</button>
<div class="chat-drawer" id="chatDrawer">
    <div class="chat-header">
        <h3 id="chatTitle">Talk to your team</h3>
        <button class="chat-close" onclick="toggleChat()">&times;</button>
    </div>
    <div class="agent-tabs" id="agentTabs">
        ${AGENTS.map((a) => '<button class="agent-tab" data-agent="' + a.id + '" onclick="selectAgent(\'' + a.id + '\',\'' + a.label + '\')">' + a.label + "</button>").join("")}
    </div>
    <div class="chat-messages" id="chatMessages">
        <div class="chat-msg agent">Pick an agent above, then ask them anything.</div>
    </div>
    <div class="chat-input-row">
        <input type="text" id="chatInput" placeholder="Message your team..." onkeydown="if(event.key==='Enter')sendChat()" disabled />
        <button id="chatSend" onclick="sendChat()" disabled>Send</button>
    </div>
</div>
<script>
let currentAgent = null;
const histories = {};

function toggleChat() {
    document.getElementById('chatDrawer').classList.toggle('open');
    if (document.getElementById('chatDrawer').classList.contains('open')) {
        document.getElementById('chatInput').focus();
    }
}

function selectAgent(id, label) {
    currentAgent = id;
    document.querySelectorAll('.agent-tab').forEach(t => t.classList.remove('active'));
    document.querySelector('[data-agent="'+id+'"]').classList.add('active');
    document.getElementById('chatTitle').textContent = label;
    document.getElementById('chatInput').disabled = false;
    document.getElementById('chatSend').disabled = false;

    const msgs = document.getElementById('chatMessages');
    msgs.innerHTML = '';
    if (histories[id]) {
        histories[id].forEach(m => {
            const div = document.createElement('div');
            div.className = 'chat-msg ' + m.role;
            div.textContent = m.text;
            msgs.appendChild(div);
        });
    }
    document.getElementById('chatInput').focus();
}

async function sendChat() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    if (!message || !currentAgent) return;

    input.value = '';
    addMsg('user', message);

    const thinking = document.createElement('div');
    thinking.className = 'chat-msg thinking';
    thinking.textContent = 'Thinking...';
    document.getElementById('chatMessages').appendChild(thinking);
    thinking.scrollIntoView({ behavior: 'smooth' });

    document.getElementById('chatInput').disabled = true;
    document.getElementById('chatSend').disabled = true;

    try {
        const res = await fetch('/ceo/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ agentId: currentAgent, message })
        });
        thinking.remove();
        const data = await res.json();
        if (data.error) {
            addMsg('error', data.error);
        } else {
            addMsg('agent', data.reply);
        }
    } catch (e) {
        thinking.remove();
        addMsg('error', 'Failed to reach agent: ' + e.message);
    }

    document.getElementById('chatInput').disabled = false;
    document.getElementById('chatSend').disabled = false;
    document.getElementById('chatInput').focus();
}

function addMsg(role, text) {
    if (!histories[currentAgent]) histories[currentAgent] = [];
    histories[currentAgent].push({ role, text });
    const div = document.createElement('div');
    div.className = 'chat-msg ' + role;
    div.textContent = text;
    document.getElementById('chatMessages').appendChild(div);
    div.scrollIntoView({ behavior: 'smooth' });
}
</script>
`;

ceoDashboard.get("/", async (c) => {
	const [goal, today, health, exps, escalations, verticals, cooActions, linkedInTeeUps] = await Promise.all([
		getGoalProgress(),
		getTodayNumbers(),
		getAgentHealth(),
		getActiveExperiments(),
		getEscalations(),
		getVerticalBreakdown(),
		getCooActions(),
		getLinkedInTeeUps(),
	]);

	const dateStr = new Date().toLocaleDateString("en-US", {
		weekday: "long",
		year: "numeric",
		month: "long",
		day: "numeric",
	});

	const goalEmoji = statusEmoji[goal.status] ?? "⚪";

	// Build escalations section
	let escalationsSection = "";
	if (escalations.length > 0) {
		const escalationItems = escalations
			.map((e: any) => {
				const payload = JSON.parse(e.payload);
				const description = payload.description || payload.reason || "Review needed";
				return (
					'<div class="escalation">' +
					"<div><strong>" +
					e.taskType +
					"</strong>: " +
					description +
					"</div>" +
					'<div style="margin-top:8px">' +
					'<form method="POST" action="/ceo/escalation/' +
					e.id +
					'/respond" style="display:inline">' +
					'<input type="hidden" name="decision" value="approve">' +
					'<button class="btn" type="submit">Approve</button>' +
					"</form>" +
					'<form method="POST" action="/ceo/escalation/' +
					e.id +
					'/respond" style="display:inline">' +
					'<input type="hidden" name="decision" value="reject">' +
					'<button class="btn btn-reject" type="submit">Reject</button>' +
					"</form>" +
					"</div>" +
					"</div>"
				);
			})
			.join("");
		escalationsSection =
			'<div class="section">' +
			"<h2>Needs Your Input (" +
			escalations.length +
			")</h2>" +
			escalationItems +
			"</div>";
	}

	// Build COO actions section
	let cooSection = "";
	if (cooActions.actions.length > 0) {
		const actionItems = cooActions.actions
			.map((a: any) => {
				const target = a.target ? " &rarr; " + a.target : "";
				return '<div class="action-item">' + a.action + target + "</div>";
			})
			.join("");
		cooSection = '<div class="section"><h2>COO Actions Today</h2>' + actionItems + "</div>";
	}

	// Build experiments section
	const expItems =
		exps.length === 0
			? '<div style="color:#888">No active experiments.</div>'
			: exps
					.map(
						(e: any) =>
							'<div class="exp-card">' +
							"<div><strong>" +
							e.surface +
							"</strong>: " +
							e.hypothesis +
							"</div>" +
							'<div style="color:#888;font-size:0.85rem">Metric: ' +
							e.primaryMetric +
							"</div>" +
							"</div>",
					)
					.join("");
	const experimentsSection =
		'<div class="section"><h2>Experiments (' + exps.length + " running)</h2>" + expItems + "</div>";

	// Build verticals section
	let verticalsSection = "";
	if (verticals.length > 0) {
		const verticalRows = verticals
			.map(
				(v: any) =>
					'<div class="agent-row"><span>' +
					v.vertical +
					"</span><span>Accounts: " +
					v.accountsIdentified +
					" | Outreach: " +
					v.outreachSent +
					"</span></div>",
			)
			.join("");
		verticalsSection = '<div class="section"><h2>Verticals</h2>' + verticalRows + "</div>";
	}

	// Build agent health section
	const healthRows = health
		.map(
			(h: any) =>
				'<div class="agent-row"><span>' +
				h.agent +
				'</span><span class="agent-status ' +
				(h.ran ? "ok" : "fail") +
				'">' +
				(h.ran ? "ran" : "not run") +
				"</span></div>",
		)
		.join("");
	const healthSection = '<div class="section"><h2>Agent Health</h2>' + healthRows + "</div>";

	// Build LinkedIn tee-ups section
	let linkedInSection = "";
	if (linkedInTeeUps.length > 0) {
		const linkedInRows = linkedInTeeUps
			.map(
				(t: any) =>
					'<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #222">' +
					"<div>" +
					'<div style="font-weight:600;color:#fff">' + (t.contactName ?? "Unknown") + "</div>" +
					'<div style="font-size:0.85rem;color:#888">' + (t.contactRole ?? "No title") + " at " + (t.accountName ?? "") + "</div>" +
					'<div style="font-size:0.8rem;color:#666">' + (t.accountVertical ?? "") + " · " + [t.accountCity, t.accountState].filter(Boolean).join(", ") + "</div>" +
					"</div>" +
					"<div>" +
					(t.email ? '<span style="font-size:0.75rem;color:#666;margin-right:8px">' + t.email + "</span>" : "") +
					'<a href="' + t.linkedinUrl + '" target="_blank" style="background:#0a66c2;color:white;padding:4px 12px;border-radius:4px;text-decoration:none;font-size:0.85rem">Connect</a>' +
					"</div>" +
					"</div>",
			)
			.join("");
		linkedInSection =
			'<div class="section"><h2>LinkedIn — Connect Today (' +
			linkedInTeeUps.length +
			")</h2>" +
			linkedInRows +
			"</div>";
	}

	const html =
		"<!DOCTYPE html>" +
		'<html lang="en">' +
		"<head>" +
		'<meta charset="UTF-8">' +
		'<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
		"<title>Vibe OS \u2014 CEO Dashboard</title>" +
		"<style>" +
		CSS +
		"</style>" +
		"</head>" +
		"<body>" +
		"<h1>Vibe OS</h1>" +
		'<div class="date">' +
		dateStr +
		"</div>" +
		'<div class="section"><h2>' +
		goalEmoji +
		" Goal: " +
		goal.title +
		"</h2>" +
		'<div class="progress">' +
		progressBar(goal.pct) +
		" " +
		goal.current +
		"/" +
		goal.target +
		" (" +
		goal.pct +
		"%)</div>" +
		"</div>" +
		'<div class="section"><h2>Today\'s Numbers</h2>' +
		'<div class="metric"><div class="metric-value">' +
		today.pipeline +
		'</div><div class="metric-label">Pipeline</div></div>' +
		'<div class="metric"><div class="metric-value">' +
		today.outreach +
		'</div><div class="metric-label">Outreach</div></div>' +
		'<div class="metric"><div class="metric-value">' +
		today.replies +
		'</div><div class="metric-label">Replies</div></div>' +
		'<div class="metric"><div class="metric-value">' +
		today.customers +
		'</div><div class="metric-label">Customers</div></div>' +
		"</div>" +
		escalationsSection +
		linkedInSection +
		cooSection +
		experimentsSection +
		verticalsSection +
		healthSection +
		CHAT_HTML +
		"</body>" +
		"</html>";

	return c.html(html);
});

ceoDashboard.post("/chat", async (c) => {
	const { agentId, message } = await c.req.json<{ agentId: string; message: string }>();
	const agent = agentMap[agentId];
	if (!agent) {
		return c.json({ error: "Unknown agent: " + agentId }, 400);
	}
	try {
		const result = await agent.generate(message);
		return c.json({ reply: result.text });
	} catch (err: any) {
		console.error("Agent chat error:", err);
		return c.json({ error: err.message ?? "Agent generation failed" }, 500);
	}
});

ceoDashboard.post("/escalation/:id/respond", async (c) => {
	const { id } = c.req.param();
	const body = await c.req.parseBody();
	const decision = body.decision as string;
	const db = getDb();
	await db
		.update(agentTasks)
		.set({
			status: "completed",
			result: JSON.stringify({
				decision,
				respondedBy: "ceo",
				respondedAt: new Date().toISOString(),
			}),
			completedAt: new Date().toISOString(),
		})
		.where(eq(agentTasks.id, id));
	return c.redirect("/ceo");
});
