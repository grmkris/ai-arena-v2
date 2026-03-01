import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import * as schema from "./schema.js";

export function createDb(config: { databasePath: string }) {
  const client = new Database(config.databasePath);
  client.run("PRAGMA journal_mode = WAL;");
  client.run("PRAGMA foreign_keys = ON;");
  return drizzle({ client, schema });
}

export type AppDatabase = ReturnType<typeof createDb>;
