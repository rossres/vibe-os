import { eq, sql } from "drizzle-orm";
import { getDb, type Database } from "../core/db/index.js";
import { accounts, apiQuotaUsage } from "../core/db/schema.js";
import type { VerticalSlug } from "../core/types.js";

export interface DiscoveryOptions {
	db?: Database;
	apiKey?: string;
}

export interface DiscoveryReport {
	accountsDiscovered: number;
	accountsSkipped: number;
	byVertical: Record<string, { discovered: number; skipped: number }>;
}

interface PlaceResult {
	id: string;
	displayName: { text: string };
	formattedAddress?: string;
	nationalPhoneNumber?: string;
	websiteUri?: string;
	rating?: number;
	userRatingCount?: number;
	addressComponents?: Array<{
		longText: string;
		types: string[];
	}>;
}

const VERTICAL_SEARCH_QUERIES: Record<string, string[]> = {
	"med-spa": ["med spa", "medical spa", "medspa", "aesthetic clinic"],
	dental: ["dental office", "dentist", "dental clinic"],
	hvac: ["hvac company", "heating and cooling", "air conditioning repair"],
	"nail-beauty": ["nail salon", "beauty salon"],
	plumbing: ["plumber", "plumbing company"],
	"spa-wellness": ["day spa", "wellness spa"],
	chiropractic: ["chiropractor", "chiropractic office"],
	veterinary: ["veterinarian", "vet clinic", "animal hospital"],
	automotive: ["auto repair", "mechanic shop"],
	roofing: ["roofing company", "roofer"],
};

// Default cities to search — expand as needed
const DEFAULT_SEARCH_CITIES = [
	"Los Angeles, CA",
	"Miami, FL",
	"Dallas, TX",
	"Phoenix, AZ",
	"Denver, CO",
	"Atlanta, GA",
	"Chicago, IL",
	"New York, NY",
	"Houston, TX",
	"San Diego, CA",
];

export class GooglePlacesDiscovery {
	private db: Database;
	private apiKey: string;

	constructor(options?: DiscoveryOptions) {
		this.db = options?.db ?? getDb();
		this.apiKey = options?.apiKey ?? process.env.GOOGLE_PLACES_API_KEY ?? "";
		if (!this.apiKey) {
			throw new Error("GOOGLE_PLACES_API_KEY is required for discovery");
		}
	}

	async discover(
		verticals: { vertical: VerticalSlug; targetCount: number }[],
		cities?: string[],
	): Promise<DiscoveryReport> {
		const searchCities = cities ?? DEFAULT_SEARCH_CITIES;
		const report: DiscoveryReport = {
			accountsDiscovered: 0,
			accountsSkipped: 0,
			byVertical: {},
		};

		for (const { vertical, targetCount } of verticals) {
			const queries = VERTICAL_SEARCH_QUERIES[vertical] ?? [vertical];
			let discovered = 0;
			let skipped = 0;

			for (const query of queries) {
				if (discovered >= targetCount) break;

				for (const city of searchCities) {
					if (discovered >= targetCount) break;

					const places = await this.searchPlaces(`${query} in ${city}`);

					for (const place of places) {
						if (discovered >= targetCount) break;

						// Check for duplicate by google_place_id
						const existing = await this.db
							.select({ id: accounts.id })
							.from(accounts)
							.where(eq(accounts.googlePlaceId, place.id))
							.limit(1);

						if (existing.length > 0) {
							skipped++;
							continue;
						}

						// Extract city/state from address components
						const placeCity = place.addressComponents?.find((c) =>
							c.types?.includes("locality"),
						)?.longText;
						const placeState = place.addressComponents?.find((c) =>
							c.types?.includes("administrative_area_level_1"),
						)?.longText;

						await this.db.insert(accounts).values({
							googlePlaceId: place.id,
							name: place.displayName.text,
							address: place.formattedAddress ?? null,
							city: placeCity ?? null,
							state: placeState ?? null,
							phone: place.nationalPhoneNumber ?? null,
							website: place.websiteUri ?? null,
							vertical,
							primaryVertical: vertical,
							sourceVertical: vertical,
							googleRating: place.rating ?? null,
							reviewCount: place.userRatingCount ?? null,
							stage: "identified",
						});

						discovered++;
					}
				}
			}

			report.byVertical[vertical] = { discovered, skipped };
			report.accountsDiscovered += discovered;
			report.accountsSkipped += skipped;
		}

		// Track API usage
		const today = new Date().toISOString().split("T")[0];
		await this.db.insert(apiQuotaUsage).values({
			platform: "google_places",
			date: today,
			callsMade: report.accountsDiscovered + report.accountsSkipped,
			quotaLimit: 1000,
		});

		return report;
	}

	private async searchPlaces(query: string): Promise<PlaceResult[]> {
		const url = "https://places.googleapis.com/v1/places:searchText";

		const response = await fetch(url, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"X-Goog-Api-Key": this.apiKey,
				"X-Goog-FieldMask":
					"places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.websiteUri,places.rating,places.userRatingCount,places.addressComponents",
			},
			body: JSON.stringify({
				textQuery: query,
				maxResultCount: 20,
				languageCode: "en",
			}),
		});

		if (!response.ok) {
			console.error(
				`[Discovery] Google Places API error: ${response.status} ${response.statusText}`,
			);
			return [];
		}

		const data = (await response.json()) as { places?: PlaceResult[] };
		return data.places ?? [];
	}
}
