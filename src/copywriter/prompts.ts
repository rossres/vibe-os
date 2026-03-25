import type { BrainService } from "../brain/service.js";
import type { ContentType, VerticalSlug, PersonaSlug, AwarenessStage, Channel } from "../core/types.js";

export interface GenerationConfig {
	type: ContentType;
	vertical?: VerticalSlug;
	persona?: PersonaSlug;
	stage?: AwarenessStage;
	platform?: Channel;
	context?: Record<string, unknown>;
	variants?: number;
}

export function buildSystemPrompt(brain: BrainService): string {
	const voice = brain.getBrandVoice();
	const pricing = brain.getPricing();
	const competitive = brain.getCompetitivePositioning();
	const narrative = brain.getNarrative Framework();
	const canonical = brain.getCanonical();
	const projectName = brain.getProjectName();

	const sections: string[] = [];

	// Role definition — built from config
	sections.push(`You are a direct-response copywriter for ${projectName}${canonical.category ? `, ${canonical.category}` : ""}.`);

	// Narrative Framework framework — only if configured
	if (narrative) {
		const mechanismStr = canonical.mechanism.length > 0
			? canonical.mechanism.join(", ")
			: "your product";

		sections.push(`## Narrative Framework — THIS DRIVES EVERYTHING
The CUSTOMER is the hero. ${projectName} is the guide.

THE HERO: ${narrative.hero}

THE PROBLEM:
- External: ${narrative.problem.external.join(", ")}
- Internal: "${narrative.problem.internal}" (${narrative.problem.internal_emotions.join(", ")})
- Philosophical: "${narrative.problem.philosophical}"

THE GUIDE (${projectName}):
- Empathy: "${narrative.guide.empathy}"
- Authority: ${narrative.guide.authority}

THE PLAN:
1. ${narrative.plan.step_1}
2. ${narrative.plan.step_2}
3. ${narrative.plan.step_3}

FAILURE (if they don't act): ${narrative.failure.join(". ")}

SUCCESS (heart + wallet — ALWAYS pair both):
- Wallet: ${narrative.success.outcomes.join(", ")}
- Heart: ${narrative.success.life_benefits.join(", ")}

ONE-LINER: "${narrative.one_liner}"
CORE IDEA: "${narrative.core_idea}"`);
	}

	// Brand voice
	sections.push(`## Brand Voice
- Tone: ${voice.tone}
- Warmth: ${voice.warmth}
- Directness: ${voice.directness}
- Style: ${voice.style}
- The owner is the hero of every piece of copy. Not ${projectName}. Not the product.`);

	// Vocabulary rules
	sections.push(`## Vocabulary Rules
- ALWAYS use: ${voice.vocabulary.prefer.join(", ")}
- NEVER use: ${voice.vocabulary.avoid.join(", ")}`);

	// Pricing — only if configured
	if (pricing) {
		const pricingTiers = pricing.tiers
			.map(
				(t) =>
					`- ${t.name}: ${t.price}/month${t.includedUnits ? `, ${t.includedUnits} units included` : ""}${t.overageRate ? `, ${t.overageRate} overage` : ""}`,
			)
			.join("\n");

		sections.push(`## Pricing
${pricingTiers}
- ROI: ${pricing.roiFraming}
- Per-unit cost: ${pricing.perUnitCost}
- Per-missed-interaction loss: ${pricing.perMissedInteractionLoss}
- vs. competitors: ${pricing.competitorComparison}`);
	}

	// Competitive positioning — only if configured
	if (competitive.keyDifferentiators.length > 0) {
		sections.push(`## Competitive Positioning
Key differentiators:
${competitive.keyDifferentiators.map((d) => `- ${d}`).join("\n")}

Only-we statements:
${competitive.onlyWeStatements.map((s) => `- ${s}`).join("\n")}`);
	}

	// Writing rules
	sections.push(`## Writing Rules
1. Lead with the owner's pain and desire, not product features
2. Every benefit must hit BOTH heart (time, freedom, peace of mind) AND wallet (revenue, growth, customers saved)
3. Use specific numbers when available
4. Every claim must be backed by data or a concrete example
5. Write at an 8th-grade reading level
6. Short paragraphs (2-3 sentences max)
${canonical.mechanism.length > 0 ? `7. Always mention: ${canonical.mechanism.join(" AND ")}` : ""}
8. Output must be valid JSON`);

	return sections.join("\n\n");
}

function getContentTypeInstructions(config: GenerationConfig): string {
	const { type, platform, variants = 3 } = config;

	switch (type) {
		case "cold_email":
			return `## Content Type: Cold Email Sequence
Generate a ${variants}-email sequence. Each email must be:
- Under 150 words
- Include merge fields: {{first_name}}, {{company_name}}, {{vertical}}
- Subject line + preview text + body
- Progressive urgency across the sequence

NARRATIVE FRAMEWORK RULES:
- The owner is the hero. Not the product.
- Lead with THEIR pain — not features
- Every email must hit both heart (time back, peace of mind) AND wallet (revenue, bookings)

Return JSON: { "variants": [{ "id": 1, "content": { "subject": "...", "preview": "...", "body": "..." } }] }`;

		case "ad_copy":
			return buildAdCopyInstructions(platform, variants);

		case "social_post":
			return buildSocialPostInstructions(platform, variants);

		case "blog_post":
			return `## Content Type: Blog Post
Generate an SEO-focused blog post in MDX format:
- Include frontmatter (title, description, keywords, author)
- Target primary keyword and 2-3 related keywords
- Aim for ~1500 words
- Use H2 and H3 subheadings for structure
- Include a compelling meta description
- End with a CTA section

Return JSON: { "variants": [{ "id": 1, "content": { "frontmatter": { "title": "...", "description": "...", "keywords": [...] }, "body": "..." } }] }`;

		case "landing_page":
			return `## Content Type: Landing Page
Generate section-by-section landing page copy following the Narrative Framework framework:
- Hero: headline about the OWNER's desire (not the product) + subheadline + CTA
- Problem: external, internal, philosophical
- Guide: empathy + authority
- Plan: 3 clear steps
- Success: pair wallet benefits with heart benefits — ALWAYS both
- Failure: what happens if they don't act
- Social proof: testimonials that hit both heart and wallet
- Pricing: tier comparison with recommended plan
- FAQ: 5-7 common objections as questions
- Final CTA: urgency + the success picture

Return JSON: { "variants": [{ "id": 1, "content": { "hero": {...}, "problem": {...}, "guide": {...}, "plan": {...}, "success": {...}, "failure": {...}, "socialProof": [...], "pricing": {...}, "faq": [...], "cta": {...} } }] }`;

		case "email_sequence":
			return `## Content Type: Email Drip Sequence
Generate a multi-email drip sequence:
- 5-7 emails spaced over 14 days
- Progressive urgency and value revelation
- Each email: subject, preview text, body, CTA
- Mix of education, social proof, and offers

Return JSON: { "variants": [{ "id": 1, "content": { "emails": [{ "day": 1, "subject": "...", "preview": "...", "body": "...", "cta": "..." }] } }] }`;

		case "sms":
			return `## Content Type: SMS
Generate SMS messages:
- 160 characters max per message
- Casual, conversational tone
- Include a clear CTA with short link placeholder
- No hashtags or emojis overload

Return JSON: { "variants": [{ "id": 1, "content": { "message": "...", "characterCount": 0 } }] }`;

		default:
			return `Generate ${variants} content variants.
Return JSON: { "variants": [{ "id": 1, "content": { ... } }] }`;
	}
}

function buildAdCopyInstructions(platform?: Channel, variants = 3): string {
	let platformSpec = "";

	switch (platform) {
		case "google_ads":
			platformSpec = `### Google Ads Format
- 3 headlines (max 30 characters each)
- 2 descriptions (max 90 characters each)
- Display URL path segments

Return JSON: { "variants": [{ "id": 1, "content": { "headlines": ["...", "...", "..."], "descriptions": ["...", "..."], "displayPath": "...", "pas": { "pain": "...", "agitation": "...", "solution": "..." } } }] }`;
			break;

		case "meta_ads":
			platformSpec = `### Meta Ads Format
- Primary text (125 characters recommended, 500 max)
- Headline (40 characters max)
- Description (30 characters max)
- CTA button text

Return JSON: { "variants": [{ "id": 1, "content": { "primaryText": "...", "headline": "...", "description": "...", "cta": "...", "pas": { "pain": "...", "agitation": "...", "solution": "..." } } }] }`;
			break;

		case "linkedin_ads":
			platformSpec = `### LinkedIn Ads Format
- Intro text (150 characters recommended)
- Headline (70 characters max)
- Description (100 characters max)

Return JSON: { "variants": [{ "id": 1, "content": { "introText": "...", "headline": "...", "description": "...", "pas": { "pain": "...", "agitation": "...", "solution": "..." } } }] }`;
			break;

		default:
			platformSpec = `### Ad Copy (General)
Generate platform-agnostic ad copy with headline, body, and CTA.

Return JSON: { "variants": [{ "id": 1, "content": { "headline": "...", "body": "...", "cta": "...", "pas": { "pain": "...", "agitation": "...", "solution": "..." } } }] }`;
			break;
	}

	return `## Content Type: Ad Copy
Generate ${variants} ad copy variants.

## PAS FRAMEWORK (Pain → Agitation → Solution) — USE THIS FOR EVERY AD
Ads are short. Use PAS to structure every variant:

**PAIN:** State the problem they feel RIGHT NOW. Use the vertical's #1 pain point.
**AGITATION:** Twist the knife. Make them feel the cost of not acting. Use the money unit + emotional cost.
**SOLUTION:** Here's the fix. Lead with the #1 ranked feature. End with CTA.

${platformSpec}`;
}

function buildSocialPostInstructions(platform?: Channel, variants = 3): string {
	let platformSpec = "";

	switch (platform) {
		case "linkedin_organic":
			platformSpec = `### LinkedIn Post
- 150-300 words
- professional but conversational tone
- Open with a hook (question, stat, or bold statement)
- Use line breaks for readability
- End with a question or CTA to drive engagement`;
			break;

		case "instagram":
			platformSpec = `### Instagram Post
- 100-200 words for the caption
- Casual, approachable tone
- Include 5-10 relevant hashtags
- Start with a scroll-stopping first line
- Include a CTA (link in bio, DM us, etc.)`;
			break;

		default:
			platformSpec = `### Social Post (General)
- 100-250 words
- Conversational tone
- Include a hook and CTA`;
			break;
	}

	return `## Content Type: Social Post
Generate ${variants} social post variants for ${platform ?? "general social"}.

${platformSpec}

Return JSON: { "variants": [{ "id": 1, "content": { "post": "...", "hashtags": [...] } }] }`;
}

export function buildGenerationPrompt(brain: BrainService, config: GenerationConfig): string {
	const sections: string[] = [];
	const canonical = brain.getCanonical();

	// Canonical narrative — only if configured
	if (canonical.hero || canonical.promise) {
		sections.push(`## CANONICAL NARRATIVE — DO NOT OVERRIDE
These are locked. Every page inherits from these. No exceptions.
${canonical.hero ? `- Hero: ${canonical.hero}` : ""}
${canonical.promise ? `- Core Promise: "${canonical.promise}"` : ""}
${canonical.category ? `- Category: "${canonical.category}"` : ""}
${canonical.mechanism.length > 0 ? `- Core Mechanism: ${canonical.mechanism.join(" + ")}` : ""}
${canonical.emotionalFrame.internalProblem ? `- Emotional Frame: Internal ("${canonical.emotionalFrame.internalProblem}") + Philosophical ("${canonical.emotionalFrame.philosophicalProblem}") + ${canonical.emotionalFrame.heartPlusWallet}` : ""}`);
	}

	// Vertical context
	if (config.vertical) {
		const template = brain.getVerticalTemplate(config.vertical);
		const langSubs = Object.entries(template.language)
			.map(([generic, specific]) => `"${generic}" → "${specific}"`)
			.join(", ");

		const rankedList = template.rankedFeatures.length > 0
			? template.rankedFeatures
				.map((f, i) => `${i + 1}. ${f.feature} — ${f.why}`)
				.join("\n")
			: template.keyFeatures.map((f, i) => `${i + 1}. ${f}`).join("\n");

		sections.push(`## Vertical: ${template.displayName}
- Tier: ${template.tier.toUpperCase()}
- Pain points: ${template.painPoints.join("; ")}
- Demo hook: ${template.demoHook}
- Revenue per missed interaction: ${template.revenuePerMissedInteraction}

## Feature Priority (LEAD WITH #1)
${rankedList}

## Tone Filter: ${template.tone.toUpperCase()}
${template.tone === "professional" ? "Use professional, composed language. No slang. Trust and authority matter." : "Use warm, conversational language. Direct and practical."}

## Language Substitutions (USE THESE)
Replace generic words with vertical-specific ones: ${langSubs}`);
	}

	// Persona context
	if (config.persona) {
		const persona = brain.getPersona(config.persona);
		if (persona.description) {
			sections.push(`## Target Persona: ${persona.name}
- ${persona.description}
- Employee range: ${persona.employeeRange}
- Revenue range: ${persona.revenueRange}
- Pain points: ${persona.topPainPoints.join("; ")}
- Communication style: ${persona.communicationStyle}
- Decision factors: ${persona.decisionFactors.join("; ")}`);
		}
	}

	// Stage messaging
	if (config.vertical && config.persona && config.stage) {
		const messaging = brain.getMessaging(config.vertical, config.persona, config.stage);
		sections.push(`## Awareness Stage: ${config.stage}
${messaging.sampleHeadlines.length > 0 ? `Sample headlines:\n${messaging.sampleHeadlines.map((h) => `- ${h}`).join("\n")}` : ""}

## Emotional Framework (USE THIS)
${messaging.internalProblem ? `Internal problem: "${messaging.internalProblem}"` : ""}
${messaging.philosophicalProblem ? `Philosophical problem: "${messaging.philosophicalProblem}"` : ""}

${messaging.failureState.length > 0 ? `If they DON'T act:\n${messaging.failureState.map((f) => `- ${f}`).join("\n")}` : ""}

${messaging.successState.wallet.length > 0 ? `If they DO act (wallet):\n${messaging.successState.wallet.map((s) => `- ${s}`).join("\n")}` : ""}

${messaging.successState.heart.length > 0 ? `If they DO act (heart):\n${messaging.successState.heart.map((s) => `- ${s}`).join("\n")}` : ""}

${messaging.valueProps.length > 0 ? `Value propositions:\n${messaging.valueProps.map((v) => `- ${v}`).join("\n")}` : ""}

Call to action: ${messaging.callToAction}`);
	}

	// Additional context
	if (config.context && Object.keys(config.context).length > 0) {
		sections.push(
			`## Additional Context\n${JSON.stringify(config.context, null, 2)}`,
		);
	}

	// Content type instructions
	sections.push(getContentTypeInstructions(config));

	// Governance validation checklist — built from config
	const voice = brain.getBrandVoice();
	sections.push(`## BEFORE YOU OUTPUT — VALIDATION CHECKLIST
Review your output against these rules. If ANY fail, rewrite before returning.
- [ ] hero_is_owner: The business owner is the hero, not the product
${canonical.mechanism.length > 0 ? `- [ ] mentions_mechanism: ${canonical.mechanism.join(" AND ")} are referenced` : ""}
- [ ] has_heart_benefit: Life/time/freedom benefit included
- [ ] has_wallet_benefit: Revenue/savings/growth benefit included
${config.vertical ? `- [ ] has_money_unit: Vertical-specific dollar value per missed interaction (${brain.getVerticalTemplate(config.vertical).revenuePerMissedInteraction})` : ""}
- [ ] no_banned_words: Does NOT use ${voice.vocabulary.avoid.slice(0, 5).map((w) => `"${w}"`).join(", ")}
${config.vertical ? `- [ ] tone_matches: Matches the ${brain.getVerticalTemplate(config.vertical).tone} tone filter` : ""}`);

	return sections.join("\n\n");
}
