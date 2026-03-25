import { defineConfig } from "drizzle-kit";

export default defineConfig({
	schema: "./src/core/db/schema.ts",
	out: "./src/core/db/migrations",
	dialect: "turso",
	dbCredentials: {
		url: "file:./data/marketing-engine.db",
	},
});
