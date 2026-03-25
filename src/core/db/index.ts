import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema.js";

let db: ReturnType<typeof createDatabase> | null = null;

function createDatabase(url: string) {
	const client = createClient({ url });
	return drizzle(client, { schema });
}

export function getDb() {
	if (!db) {
		const dbPath = process.env.DATABASE_URL || "file:./data/marketing-engine.db";
		db = createDatabase(dbPath);
	}
	return db;
}

export type Database = ReturnType<typeof createDatabase>;
export { schema };
