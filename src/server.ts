/**
 * AI Arena v2 — Server Entry Point
 *
 * Single Bun.serve() instance with:
 *   - Static HTML SPA via Bun's native HTML import
 *   - Full REST API (agent endpoints + lobby + leaderboard + replays)
 *   - WebSocket spectator stream (/ws/spectator)
 *   - Physics (Rapier3D WASM) initialized before any match logic runs
 *   - SQLite via Drizzle ORM (WAL mode, auto schema push)
 */

import index from "./ui/index.html";
import { env } from "./env.js";
import { createDb } from "./db/client.js";
import { initPhysics } from "./sim/init.js";
import { MatchManager } from "./match/match-manager.js";
import { createApiRoutes } from "./routes/api.js";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

// ── Ensure data directories exist ────────────────────────────────────────────

mkdirSync(dirname(env.DATABASE_PATH), { recursive: true });
mkdirSync(env.REPLAY_DIR, { recursive: true });

// ── Physics ───────────────────────────────────────────────────────────────────

console.log("[Server] Initializing Rapier3D WASM...");
await initPhysics();
console.log("[Server] Rapier3D ready.");

// ── Database ──────────────────────────────────────────────────────────────────

console.log("[Server] Opening SQLite database:", env.DATABASE_PATH);
const db = createDb({ databasePath: env.DATABASE_PATH });

// Push schema — create tables that don't exist yet without requiring drizzle-kit CLI.
// This runs raw DDL that mirrors db/schema.ts and is idempotent (IF NOT EXISTS).
db.$client.run(`
  CREATE TABLE IF NOT EXISTS matches (
    id          TEXT    PRIMARY KEY,
    timestamp   INTEGER NOT NULL,
    agent_a     TEXT    NOT NULL,
    agent_b     TEXT    NOT NULL,
    winner      INTEGER,
    reason      TEXT    NOT NULL,
    final_tick  INTEGER NOT NULL,
    duration_s  REAL    NOT NULL,
    elo_change_a REAL,
    elo_change_b REAL,
    created_at  INTEGER NOT NULL DEFAULT (unixepoch('now') * 1000),
    updated_at  INTEGER NOT NULL DEFAULT (unixepoch('now') * 1000)
  );
`);

db.$client.run(`
  CREATE TABLE IF NOT EXISTS agent_stats (
    agent_name   TEXT    PRIMARY KEY,
    display_name TEXT    NOT NULL,
    wins         INTEGER NOT NULL DEFAULT 0,
    losses       INTEGER NOT NULL DEFAULT 0,
    draws        INTEGER NOT NULL DEFAULT 0,
    elo          REAL    NOT NULL DEFAULT 1000,
    last_seen    INTEGER,
    created_at   INTEGER NOT NULL DEFAULT (unixepoch('now') * 1000),
    updated_at   INTEGER NOT NULL DEFAULT (unixepoch('now') * 1000)
  );
`);

console.log("[Server] Schema ready.");

// ── Match Manager ─────────────────────────────────────────────────────────────

const matchManager = new MatchManager(db);

// ── API Routes ────────────────────────────────────────────────────────────────

const apiRoutes = createApiRoutes(matchManager, db);

// ── CORS headers (reused for fetch() fallback) ───────────────────────────────

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// ── Server ────────────────────────────────────────────────────────────────────

const server = Bun.serve({
  port: env.PORT,

  routes: {
    // SPA pages — served by Bun's native HTML bundler
    "/": index,
    "/join": index,
    "/leaderboard": index,
    "/replays": index,

    // All API + data routes
    ...apiRoutes,
  },

  fetch(req, server) {
    const url = new URL(req.url);

    // Global CORS preflight for any unmatched OPTIONS request
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // WebSocket upgrade — spectator real-time stream
    if (url.pathname === "/ws/spectator") {
      if (server.upgrade(req)) return undefined as unknown as Response;
      return new Response("WebSocket upgrade failed", { status: 400 });
    }

    // SPA fallback for /replays/:id (dynamic replay viewer pages)
    if (url.pathname.startsWith("/replays/")) {
      return new Response(Bun.file(new URL("./ui/index.html", import.meta.url)));
    }

    return new Response("Not Found", { status: 404 });
  },

  websocket: {
    open(ws) {
      matchManager.addSpectator(ws);
    },
    close(ws) {
      matchManager.removeSpectator(ws);
    },
    message() {
      // Spectators are read-only; ignore any incoming messages.
    },
  },

  development: env.NODE_ENV !== "production",
});

// ── Startup log ───────────────────────────────────────────────────────────────

console.log(`[Server] AI Arena v2 listening on ${server.url}`);
console.log(`[Server] ── Agent HTTP API ──`);
console.log(`[Server]   POST ${server.url}api/join`);
console.log(`[Server]   GET  ${server.url}api/game-state`);
console.log(`[Server]   POST ${server.url}api/action`);
console.log(`[Server]   POST ${server.url}api/leave`);
console.log(`[Server] ── Lobby ──`);
console.log(`[Server]   GET  ${server.url}api/lobby`);
console.log(`[Server]   GET  ${server.url}api/leaderboard`);
console.log(`[Server]   GET  ${server.url}api/match-history`);
console.log(`[Server] ── Viewer ──`);
console.log(`[Server]   WS   ws://${server.url.host}/ws/spectator`);
console.log(`[Server] ── Other ──`);
console.log(`[Server]   GET  ${server.url}health`);
console.log(`[Server]   GET  ${server.url}llm.txt`);
console.log(`[Server]   GET  ${server.url}api/replays`);

export { server };
