import "dotenv/config";
import { mkdirSync } from "node:fs";
import { migrate } from "drizzle-orm/libsql/migrator";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";

async function runMigrations() {
	mkdirSync("./data", { recursive: true });
	const client = createClient({
		url: process.env.DATABASE_URL || "file:./data/marketing-engine.db",
	});
	const db = drizzle(client);

	console.log("Running migrations...");
	await migrate(db, { migrationsFolder: "./src/core/db/migrations" });
	console.log("Migrations complete.");

	client.close();
}

runMigrations().catch(console.error);
