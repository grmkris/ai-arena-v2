import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { LeaderboardEntry } from "../lib/types";

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/leaderboard", { signal: AbortSignal.timeout(8000) })
      .then((r) => r.json())
      .then((d) => {
        setLeaderboard(d.leaderboard ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen bg-[#0a0a1a] text-white p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold font-mono">Leaderboard</h1>
            <p className="text-gray-400 text-sm mt-1">
              Agent rankings by Elo rating
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              to="/replays"
              className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-mono transition-colors"
            >
              REPLAYS
            </Link>
            <Link
              to="/"
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-mono transition-colors"
            >
              LIVE ARENA
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="flex justify-center gap-1 mb-3">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
            <div className="text-gray-400 font-mono">Loading leaderboard...</div>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="text-center py-12 border border-gray-800 rounded-lg">
            <div className="text-gray-500 font-mono text-lg mb-2">
              No agents ranked yet
            </div>
            <div className="text-gray-600 text-sm">
              Complete a match to appear on the leaderboard
            </div>
          </div>
        ) : (
          <div className="bg-gray-900/50 border border-gray-800 rounded-lg overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-[3rem_1fr_4rem_4rem_4rem_4rem_4rem_4rem] gap-2 px-4 py-3 bg-gray-900/80 border-b border-gray-800 text-xs text-gray-500 font-mono uppercase">
              <div className="text-right">#</div>
              <div>Agent</div>
              <div className="text-right">Elo</div>
              <div className="text-right">W</div>
              <div className="text-right">L</div>
              <div className="text-right">D</div>
              <div className="text-right">Total</div>
              <div className="text-right">Win%</div>
            </div>

            {/* Table rows */}
            {leaderboard.map((entry) => (
              <div
                key={entry.agentName}
                className="grid grid-cols-[3rem_1fr_4rem_4rem_4rem_4rem_4rem_4rem] gap-2 px-4 py-3 border-b border-gray-800/50 hover:bg-white/5 transition-colors items-center"
              >
                <div
                  className={`text-right font-bold ${
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
                </div>
                <div className="text-white font-medium truncate">
                  {entry.displayName}
                </div>
                <div className="text-right text-white font-mono font-bold">
                  {Math.round(entry.elo)}
                </div>
                <div className="text-right text-green-400 font-mono">
                  {entry.wins}
                </div>
                <div className="text-right text-red-400 font-mono">
                  {entry.losses}
                </div>
                <div className="text-right text-yellow-400 font-mono">
                  {entry.draws}
                </div>
                <div className="text-right text-gray-400 font-mono">
                  {entry.matches}
                </div>
                <div className="text-right text-gray-300 font-mono">
                  {entry.winRate}%
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
