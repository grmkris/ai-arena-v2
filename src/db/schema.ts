import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { baseEntityFields, typeIdPrimaryKey } from "./columns.js";

export const matches = sqliteTable("matches", {
  id: typeIdPrimaryKey("mat"),
  timestamp: integer("timestamp", { mode: "timestamp_ms" }).notNull(),
  agentA: text("agent_a").notNull(),
  agentB: text("agent_b").notNull(),
  winner: integer("winner"), // 0, 1, or null (draw)
  reason: text("reason").notNull(), // "ring_out" | "timeout" | "disconnect"
  finalTick: integer("final_tick").notNull(),
  durationS: real("duration_s").notNull(),
  eloChangeA: real("elo_change_a"),
  eloChangeB: real("elo_change_b"),
  ...baseEntityFields,
});

export const agentStats = sqliteTable("agent_stats", {
  agentName: text("agent_name").primaryKey(), // lowercase, unique
  displayName: text("display_name").notNull(),
  wins: integer("wins").notNull().default(0),
  losses: integer("losses").notNull().default(0),
  draws: integer("draws").notNull().default(0),
  elo: real("elo").notNull().default(1000),
  lastSeen: integer("last_seen", { mode: "timestamp_ms" }),
  ...baseEntityFields,
});
