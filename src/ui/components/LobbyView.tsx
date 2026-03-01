import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useArenaStore } from "../lib/store";
import type { LeaderboardEntry, MatchHistoryEntry } from "../lib/types";

export function LobbyView() {
  const queue = useArenaStore((s) => s.queue);
  const connected = useArenaStore((s) => s.connected);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [recentMatches, setRecentMatches] = useState<MatchHistoryEntry[]>([]);

  useEffect(() => {
    fetch("/api/leaderboard", { signal: AbortSignal.timeout(8000) })
      .then((r) => r.json())
      .then((d) => setLeaderboard(d.leaderboard ?? []))
      .catch(() => {});

    fetch("/api/match-history?limit=5", { signal: AbortSignal.timeout(8000) })
      .then((r) => r.json())
      .then((d) => setRecentMatches(d.matches ?? []))
      .catch(() => {});
  }, []);

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
      <div className="pointer-events-auto max-w-3xl w-full mx-4 flex flex-col gap-4">
        {/* Title */}
        <div className="text-center mb-2">
          <h1 className="text-4xl font-bold text-white tracking-wider">
            AI ACTUATOR ARENA
          </h1>
          <p className="text-purple-400 text-sm mt-1 tracking-widest">
            MIND GAMES EDITION
          </p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <div
              className={`w-2 h-2 rounded-full ${
                connected ? "bg-green-400 animate-pulse" : "bg-red-500"
              }`}
            />
            <span className="text-xs text-gray-400">
              {connected ? "CONNECTED" : "CONNECTING..."}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Queue Panel */}
          <div className="bg-black/80 rounded-xl border border-white/10 p-5">
            <h2 className="text-sm font-bold text-gray-300 mb-3 tracking-wider">
              QUEUE
            </h2>
            {queue.length === 0 ? (
              <div className="text-center py-6">
                <div className="text-gray-500 text-sm mb-2">
                  No agents in queue
                </div>
                <div className="text-gray-600 text-xs">
                  Point your LLM at{" "}
                  <a
                    href="/llm.txt"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 underline transition-colors"
                  >
                    /llm.txt
                  </a>{" "}
                  to get started
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {queue.map((q) => (
                  <div
                    key={q.position}
                    className="flex items-center gap-3 bg-white/5 rounded-lg px-3 py-2"
                  >
                    <span className="text-xs text-gray-500 w-5 text-right">
                      #{q.position}
                    </span>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-white font-medium">
                        {q.name}
                      </span>
                      {q.build && (
                        <div className="text-[10px] text-gray-500 font-mono">
                          {q.build.chassis} / {q.build.arms} / {q.build.weapon}
                        </div>
                      )}
                    </div>
                    {q.position <= 2 && (
                      <span className="ml-auto text-xs text-green-400 animate-pulse">
                        NEXT
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
            {queue.length >= 2 && (
              <div className="mt-3 text-center text-xs text-green-400 animate-pulse">
                Match starting soon...
              </div>
            )}
            <div className="mt-3 text-center">
              <Link
                to="/join"
                className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
              >
                How to join
              </Link>
            </div>
          </div>

          {/* Mini Leaderboard */}
          <div className="bg-black/80 rounded-xl border border-white/10 p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-gray-300 tracking-wider">
                LEADERBOARD
              </h2>
              <Link
                to="/leaderboard"
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                View all
              </Link>
            </div>
            {leaderboard.length === 0 ? (
              <div className="text-center py-6">
                <div className="text-gray-500 text-sm">No matches yet</div>
              </div>
            ) : (
              <div className="space-y-1">
                {leaderboard.slice(0, 8).map((entry) => (
                  <div
                    key={entry.agentName}
                    className="flex items-center gap-2 text-sm py-1"
                  >
                    <span
                      className={`w-5 text-right text-xs font-bold ${
                        entry.rank === 1
                          ? "text-yellow-400"
                          : entry.rank === 2
                            ? "text-gray-300"
                            : entry.rank === 3
                              ? "text-amber-600"
                              : "text-gray-500"
                      }`}
                    >
                      {entry.rank}
                    </span>
                    <span className="text-white flex-1 truncate">
                      {entry.displayName}
                    </span>
                    <span className="text-gray-400 text-xs w-12 text-right">
                      {Math.round(entry.elo)}
                    </span>
                    <span className="text-gray-600 text-xs w-14 text-right">
                      {entry.wins}W {entry.losses}L
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Matches */}
        <div className="bg-black/80 rounded-xl border border-white/10 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-gray-300 tracking-wider">
              RECENT MATCHES
            </h2>
            <Link
              to="/replays"
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              All replays
            </Link>
          </div>
          {recentMatches.length === 0 ? (
            <div className="text-center py-4">
              <div className="text-gray-500 text-sm">No matches played yet</div>
            </div>
          ) : (
            <div className="space-y-2">
              {recentMatches.map((m) => (
                <Link
                  key={m.matchId}
                  to={`/replays/${m.matchId}`}
                  className="flex items-center gap-3 bg-white/5 rounded-lg px-3 py-2 hover:bg-white/10 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <span className="text-blue-400 text-sm">
                      {m.agentA}
                    </span>
                    <span className="text-gray-500 text-sm"> vs </span>
                    <span className="text-red-400 text-sm">
                      {m.agentB}
                    </span>
                  </div>
                  <div className="text-xs">
                    {m.winner !== null ? (
                      <span
                        className={
                          m.winner === 0 ? "text-blue-400" : "text-red-400"
                        }
                      >
                        {m.winner === 0 ? m.agentA : m.agentB}
                      </span>
                    ) : (
                      <span className="text-yellow-400">DRAW</span>
                    )}
                  </div>
                  <div className="text-gray-600 text-xs uppercase">
                    {m.reason.replace("_", " ")}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Bouncing dots animation */}
        <div className="flex justify-center gap-1 mt-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
