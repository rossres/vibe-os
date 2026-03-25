import { Hono } from "hono";
import { eq, and } from "drizzle-orm";
import { getDb } from "../core/db/index.js";
import { content, attributionEvents, experiments, experimentVariants, experimentResults } from "../core/db/schema.js";
import { renderLandingPage, type LandingPageData } from "./renderer.js";

export const landingPages = new Hono();

// Serve landing page by vertical
landingPages.get("/:vertical", async (c) => {
	const vertical = c.req.param("vertical");
	const db = getDb();

	// Check for running A/B experiment on this vertical's landing page
	const runningExperiment = await db
		.select()
		.from(experiments)
		.where(
			and(
				eq(experiments.surface, "landing_page"),
				eq(experiments.vertical, vertical),
				eq(experiments.status, "running"),
			),
		)
		.limit(1);

	let pageContent: typeof content.$inferSelect | null = null;
	let variantId: string | null = null;
	let experimentId: string | null = null;

	if (runningExperiment.length > 0) {
		// A/B test active — randomly assign a variant
		experimentId = runningExperiment[0].id;
		const variants = await db
			.select()
			.from(experimentVariants)
			.where(eq(experimentVariants.experimentId, experimentId));

		if (variants.length > 0) {
			const chosen = variants[Math.floor(Math.random() * variants.length)];
			variantId = chosen.id;

			// Load variant content
			if (chosen.contentRef) {
				const rows = await db
					.select()
					.from(content)
					.where(eq(content.id, Number(chosen.contentRef)))
					.limit(1);
				if (rows.length > 0) pageContent = rows[0];
			}

			// Increment impressions for this variant
			const existing = await db
				.select()
				.from(experimentResults)
				.where(
					and(
						eq(experimentResults.experimentId, experimentId),
						eq(experimentResults.variantId, variantId),
					),
				)
				.limit(1);

			if (existing.length > 0) {
				await db
					.update(experimentResults)
					.set({
						visits: (existing[0].visits ?? 0) + 1,
						impressions: (existing[0].impressions ?? 0) + 1,
						updatedAt: new Date().toISOString(),
					})
					.where(eq(experimentResults.id, existing[0].id));
			}
		}
	}

	// Fallback: load latest approved landing page for this vertical
	if (!pageContent) {
		const rows = await db
			.select()
			.from(content)
			.where(
				and(
					eq(content.type, "landing_page"),
					eq(content.vertical, vertical),
					eq(content.status, "approved"),
				),
			)
			.limit(1);

		if (rows.length > 0) pageContent = rows[0];
	}

	if (!pageContent) {
		return c.text(`No landing page found for vertical: ${vertical}`, 404);
	}

	// Parse the content body as landing page data
	let pageData: LandingPageData;
	try {
		const body = JSON.parse(pageContent.body);
		pageData = {
			vertical,
			hero: body.hero ?? { headline: "Never miss a customer again", subheadline: "AI front desk for your business", cta: "Claim your number" },
			problem: body.problem ?? { external: [], internal: "", philosophical: "" },
			guide: body.guide ?? { empathy: "", authority: "" },
			plan: body.plan ?? [],
			success: body.success ?? [],
			failure: body.failure ?? [],
			pricing: body.pricing,
			faq: body.faq,
			socialProof: body.socialProof,
			trackingSlug: `${vertical}/${pageContent.id}`,
		};
	} catch {
		return c.text("Invalid landing page content format", 500);
	}

	const html = renderLandingPage(pageData);
	return c.html(html);
});

// Track page events (view, scroll, etc.)
landingPages.post("/:vertical/:contentId/track", async (c) => {
	const vertical = c.req.param("vertical");
	const contentId = Number(c.req.param("contentId"));
	const db = getDb();

	await db.insert(attributionEvents).values({
		touchpointType: "landing_page_visit",
		channel: "landing_page",
		contentId: contentId || null,
	});

	return c.json({ ok: true });
});

// CTA click — "Claim your number"
landingPages.get("/:vertical/:contentId/claim", async (c) => {
	const vertical = c.req.param("vertical");
	const contentId = Number(c.req.param("contentId"));
	const db = getDb();

	await db.insert(attributionEvents).values({
		touchpointType: "cta_click",
		channel: "landing_page",
		contentId: contentId || null,
	});

	// Redirect to main site or signup flow
	return c.html(`<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Get Started</title>
	<style>
		* { margin: 0; padding: 0; box-sizing: border-box; }
		body {
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
			background: #0f172a;
			color: #fff;
			min-height: 100vh;
			display: flex;
			align-items: center;
			justify-content: center;
			text-align: center;
			padding: 2rem;
		}
		h1 { font-size: 2rem; margin-bottom: 1rem; }
		p { color: #94a3b8; font-size: 1.1rem; margin-bottom: 2rem; }
		.check { color: #22c55e; font-size: 3rem; margin-bottom: 1rem; }
	</style>
</head>
<body>
	<div>
		<div class="check">&#10003;</div>
		<h1>Your number is being set up</h1>
		<p>We'll be in touch shortly to get your ${vertical.replace(/-/g, " ")} business set up.</p>
	</div>
</body>
</html>`);
});
