import { google } from "googleapis";
import { eq } from "drizzle-orm";
import { getDb } from "../../core/db/index.js";
import { oauthTokens } from "../../core/db/schema.js";

const SCOPES = ["https://www.googleapis.com/auth/adwords"];

export function getOAuth2Client() {
	return new google.auth.OAuth2(
		process.env.GOOGLE_CLIENT_ID,
		process.env.GOOGLE_CLIENT_SECRET,
		"http://localhost:3333/oauth/callback",
	);
}

/**
 * Generate the URL the user needs to visit to authorize.
 */
export function getAuthUrl(): string {
	const oauth2Client = getOAuth2Client();
	return oauth2Client.generateAuthUrl({
		access_type: "offline",
		prompt: "consent",
		scope: SCOPES,
	});
}

/**
 * Exchange an auth code for tokens and store them.
 */
export async function handleCallback(code: string): Promise<void> {
	const oauth2Client = getOAuth2Client();
	const { tokens } = await oauth2Client.getToken(code);

	const db = getDb();

	// Remove old Google Ads tokens
	await db.delete(oauthTokens).where(eq(oauthTokens.platform, "google_ads"));

	// Store new tokens
	await db.insert(oauthTokens).values({
		platform: "google_ads",
		accessTokenEnc: tokens.access_token ?? "",
		refreshTokenEnc: tokens.refresh_token ?? "",
		expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
		scopes: SCOPES.join(","),
	});
}

/**
 * Get a valid refresh token from the DB.
 */
export async function getRefreshToken(): Promise<string | null> {
	const db = getDb();
	const rows = await db
		.select()
		.from(oauthTokens)
		.where(eq(oauthTokens.platform, "google_ads"))
		.limit(1);

	if (rows.length === 0) return null;
	return rows[0].refreshTokenEnc || null;
}
