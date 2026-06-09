import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Resolve paths relative to the package root so this works from src/ (tsx) and dist/ alike.
const packageDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = path.join(packageDir, "data");

mkdirSync(dataDir, { recursive: true });

const client = createClient({ url: `file:${path.join(dataDir, "feedback.db")}` });

export const db = drizzle(client);

export async function runMigrations(): Promise<void> {
  await migrate(db, { migrationsFolder: path.join(packageDir, "drizzle") });
}
