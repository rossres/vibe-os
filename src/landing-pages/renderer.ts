export interface LandingPageData {
	vertical: string;
	hero: {
		headline: string;
		subheadline: string;
		cta: string;
	};
	problem: {
		external: string[];
		internal: string;
		philosophical: string;
	};
	guide: {
		empathy: string;
		authority: string;
	};
	plan: Array<{ step: string; description: string }>;
	success: string[];
	failure: string[];
	pricing?: Array<{
		name: string;
		price: string;
		features: string[];
	}>;
	faq?: Array<{ question: string; answer: string }>;
	socialProof?: string[];
	businessName?: string;
	trackingSlug: string;
}

function escapeHtml(text: string): string {
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

export function renderLandingPage(data: LandingPageData): string {
	const {
		hero,
		problem,
		guide,
		plan,
		success,
		failure,
		pricing,
		faq,
		socialProof,
		trackingSlug,
	} = data;

	const ga4Id = process.env.GA4_PROPERTY_ID ? `G-${process.env.GA4_PROPERTY_ID}` : "";
	const ga4Snippet = ga4Id ? `
	<!-- Google Analytics 4 -->
	<script async src="https://www.googletagmanager.com/gtag/js?id=${ga4Id}"></script>
	<script>
		window.dataLayer = window.dataLayer || [];
		function gtag(){dataLayer.push(arguments);}
		gtag('js', new Date());
		gtag('config', '${ga4Id}');
	</script>` : "";

	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>${escapeHtml(hero.headline)}</title>${ga4Snippet}
	<style>
		* { margin: 0; padding: 0; box-sizing: border-box; }
		body {
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
			background: #fff;
			color: #1a1a1a;
			line-height: 1.6;
		}
		.section { padding: 4rem 1.5rem; max-width: 800px; margin: 0 auto; }
		.hero-section {
			background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
			color: #fff;
			text-align: center;
			padding: 5rem 1.5rem;
		}
		.hero-section h1 {
			font-size: 2.5rem;
			font-weight: 800;
			line-height: 1.15;
			max-width: 700px;
			margin: 0 auto 1rem;
			letter-spacing: -0.02em;
		}
		.hero-section p {
			font-size: 1.25rem;
			color: #94a3b8;
			max-width: 550px;
			margin: 0 auto 2rem;
		}
		.cta-button {
			display: inline-block;
			background: #22c55e;
			color: #fff;
			font-size: 1.2rem;
			font-weight: 700;
			padding: 1rem 2.5rem;
			border-radius: 8px;
			text-decoration: none;
			transition: background 0.2s;
			border: none;
			cursor: pointer;
		}
		.cta-button:hover { background: #16a34a; }
		h2 {
			font-size: 1.8rem;
			font-weight: 700;
			margin-bottom: 1.5rem;
			letter-spacing: -0.01em;
		}
		.problem-section { background: #f8fafc; }
		.problem-list { list-style: none; }
		.problem-list li {
			padding: 0.75rem 0;
			border-bottom: 1px solid #e2e8f0;
			font-size: 1.1rem;
		}
		.problem-list li:last-child { border-bottom: none; }
		.internal-problem {
			font-size: 1.3rem;
			font-style: italic;
			color: #475569;
			margin: 1.5rem 0;
			padding-left: 1rem;
			border-left: 3px solid #3b82f6;
		}
		.guide-section { text-align: center; }
		.guide-section .empathy {
			font-size: 1.2rem;
			color: #475569;
			margin-bottom: 1rem;
		}
		.guide-section .authority {
			font-size: 1rem;
			color: #64748b;
		}
		.plan-section { background: #f8fafc; }
		.plan-steps {
			display: grid;
			gap: 1.5rem;
			counter-reset: step;
		}
		.plan-step {
			display: flex;
			gap: 1rem;
			align-items: flex-start;
		}
		.step-number {
			flex-shrink: 0;
			width: 40px;
			height: 40px;
			background: #3b82f6;
			color: #fff;
			border-radius: 50%;
			display: flex;
			align-items: center;
			justify-content: center;
			font-weight: 700;
			font-size: 1.1rem;
		}
		.step-content h3 { font-size: 1.1rem; margin-bottom: 0.25rem; }
		.step-content p { color: #475569; }
		.success-section {
			background: #f0fdf4;
			text-align: center;
		}
		.success-list {
			list-style: none;
			display: flex;
			flex-wrap: wrap;
			justify-content: center;
			gap: 1rem;
			margin-top: 1rem;
		}
		.success-list li {
			background: #dcfce7;
			color: #166534;
			padding: 0.5rem 1.25rem;
			border-radius: 100px;
			font-weight: 500;
		}
		.failure-section {
			text-align: center;
			color: #475569;
		}
		.failure-section p {
			font-size: 1.1rem;
			margin-bottom: 0.5rem;
		}
		.pricing-section { text-align: center; }
		.pricing-grid {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
			gap: 1.5rem;
			margin-top: 1.5rem;
		}
		.pricing-card {
			border: 1px solid #e2e8f0;
			border-radius: 12px;
			padding: 1.5rem;
			text-align: left;
		}
		.pricing-card h3 { font-size: 1.2rem; margin-bottom: 0.5rem; }
		.pricing-card .price {
			font-size: 2rem;
			font-weight: 800;
			color: #1e293b;
			margin-bottom: 1rem;
		}
		.pricing-card ul { list-style: none; }
		.pricing-card li { padding: 0.3rem 0; color: #475569; }
		.faq-section { background: #f8fafc; }
		.faq-item { margin-bottom: 1.5rem; }
		.faq-item h3 { font-size: 1.05rem; margin-bottom: 0.5rem; }
		.faq-item p { color: #475569; }
		.final-cta {
			text-align: center;
			background: #0f172a;
			color: #fff;
			padding: 4rem 1.5rem;
		}
		.final-cta h2 { color: #fff; margin-bottom: 1rem; }
		.final-cta p { color: #94a3b8; margin-bottom: 2rem; }
		.social-proof {
			display: flex;
			flex-wrap: wrap;
			justify-content: center;
			gap: 0.75rem;
			margin-top: 1.5rem;
		}
		.social-proof span {
			font-size: 0.85rem;
			color: #94a3b8;
			background: rgba(255,255,255,0.05);
			padding: 0.35rem 0.75rem;
			border-radius: 4px;
		}
		@media (max-width: 640px) {
			.hero-section h1 { font-size: 1.8rem; }
			.hero-section { padding: 3rem 1rem; }
			.section { padding: 2.5rem 1rem; }
		}
	</style>
</head>
<body>
	<!-- HERO -->
	<div class="hero-section">
		<h1>${escapeHtml(hero.headline)}</h1>
		<p>${escapeHtml(hero.subheadline)}</p>
		<a href="/lp/${escapeHtml(trackingSlug)}/claim" class="cta-button">${escapeHtml(hero.cta)}</a>
		${
			socialProof
				? `<div class="social-proof">${socialProof.map((s) => `<span>${escapeHtml(s)}</span>`).join("")}</div>`
				: ""
		}
	</div>

	<!-- PROBLEM -->
	<div class="section problem-section">
		<h2>Sound familiar?</h2>
		<ul class="problem-list">
			${problem.external.map((p) => `<li>${escapeHtml(p)}</li>`).join("")}
		</ul>
		<div class="internal-problem">"${escapeHtml(problem.internal)}"</div>
		<p style="color: #64748b; text-align: center; margin-top: 1rem;">${escapeHtml(problem.philosophical)}</p>
	</div>

	<!-- GUIDE -->
	<div class="section guide-section">
		<p class="empathy">${escapeHtml(guide.empathy)}</p>
		<p class="authority">${escapeHtml(guide.authority)}</p>
	</div>

	<!-- PLAN -->
	<div class="section plan-section">
		<h2>Here's the plan</h2>
		<div class="plan-steps">
			${plan
				.map(
					(step, i) => `
				<div class="plan-step">
					<div class="step-number">${i + 1}</div>
					<div class="step-content">
						<h3>${escapeHtml(step.step)}</h3>
						<p>${escapeHtml(step.description)}</p>
					</div>
				</div>
			`,
				)
				.join("")}
		</div>
	</div>

	<!-- SUCCESS -->
	<div class="section success-section">
		<h2>Imagine this</h2>
		<ul class="success-list">
			${success.map((s) => `<li>${escapeHtml(s)}</li>`).join("")}
		</ul>
	</div>

	<!-- FAILURE -->
	<div class="section failure-section">
		<h2>What happens if you do nothing?</h2>
		${failure.map((f) => `<p>${escapeHtml(f)}</p>`).join("")}
	</div>

	${
		pricing
			? `
	<!-- PRICING -->
	<div class="section pricing-section">
		<h2>Simple pricing</h2>
		<div class="pricing-grid">
			${pricing
				.map(
					(tier) => `
				<div class="pricing-card">
					<h3>${escapeHtml(tier.name)}</h3>
					<div class="price">${escapeHtml(tier.price)}</div>
					<ul>
						${tier.features.map((f) => `<li>${escapeHtml(f)}</li>`).join("")}
					</ul>
				</div>
			`,
				)
				.join("")}
		</div>
	</div>`
			: ""
	}

	${
		faq
			? `
	<!-- FAQ -->
	<div class="section faq-section">
		<h2>Common questions</h2>
		${faq
			.map(
				(item) => `
			<div class="faq-item">
				<h3>${escapeHtml(item.question)}</h3>
				<p>${escapeHtml(item.answer)}</p>
			</div>
		`,
			)
			.join("")}
	</div>`
			: ""
	}

	<!-- FINAL CTA -->
	<div class="final-cta">
		<h2>${escapeHtml(hero.headline)}</h2>
		<p>${escapeHtml(hero.subheadline)}</p>
		<a href="/lp/${escapeHtml(trackingSlug)}/claim" class="cta-button">${escapeHtml(hero.cta)}</a>
	</div>

	<script>
		// Track page view
		fetch('/lp/${escapeHtml(trackingSlug)}/track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ event: 'page_view' }) });

		// GA4 CTA click tracking
		document.querySelectorAll('.cta-button').forEach(function(btn) {
			btn.addEventListener('click', function() {
				if (typeof gtag === 'function') {
					gtag('event', 'cta_click', {
						event_category: 'conversion',
						event_label: '${escapeHtml(trackingSlug)}',
						value: 1,
					});
				}
			});
		});
	</script>
</body>
</html>`;
}
