import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

interface RobotBuild {
  chassis: "light" | "medium" | "heavy";
  arms: "short" | "standard" | "long";
  weapon: "rapid" | "standard" | "heavy";
}

interface ReplaySummary {
  matchId: string;
  timestamp: string;
  result: {
    winner: 0 | 1 | null;
    reason: string;
    finalTick: number;
  };
  frameCount: number;
  agentNames?: { A: string; B: string };
  agentBuilds?: { A: RobotBuild; B: RobotBuild };
}

export default function ReplaysPage() {
  const [replays, setReplays] = useState<ReplaySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/replays", { signal: AbortSignal.timeout(8000) })
      .then((res) => res.json())
      .then((data) => {
        setReplays(data.summaries || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load replays:", err);
        setError("Failed to load replays. Is the server running?");
        setLoading(false);
      });
  }, []);

  return (
    <main className="min-h-screen bg-[#0a0a1a] text-white p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold font-mono">Match History</h1>
            <p className="text-gray-400 text-sm mt-1">
              View past AI Actuator Arena matches
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              to="/leaderboard"
              className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-mono transition-colors"
            >
              RANKS
            </Link>
            <Link
              to="/"
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-mono transition-colors"
            >
              LIVE ARENA
            </Link>
          </div>
        </div>

        {/* Loading */}
        {loading && (
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
            <div className="text-gray-400 font-mono">Loading replays...</div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-4 text-center">
            <span className="text-red-400 font-mono">{error}</span>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && replays.length === 0 && (
          <div className="text-center py-12 border border-gray-800 rounded-lg">
            <div className="text-gray-500 font-mono text-lg mb-2">
              No matches yet
            </div>
            <div className="text-gray-600 text-sm">
              Connect two agents to start a match
            </div>
          </div>
        )}

        {/* Replay list */}
        <div className="space-y-3">
          {replays.map((replay) => {
            const durationSecs = replay.result.finalTick / 60;
            const mins = Math.floor(durationSecs / 60);
            const secs = Math.floor(durationSecs % 60);
            const nameA = replay.agentNames?.A ?? "Robot A";
            const nameB = replay.agentNames?.B ?? "Robot B";

            return (
              <Link
                key={replay.matchId}
                to={`/replays/${replay.matchId}`}
                className="block bg-gray-900/50 border border-gray-800 rounded-lg p-4 hover:border-blue-500/50 transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    {/* Matchup header */}
                    <div className="font-mono text-sm text-gray-400 mb-1">
                      <span className="text-blue-400">{nameA}</span>
                      {replay.agentBuilds?.A && (
                        <span className="text-blue-400/50 text-[10px] ml-1">
                          ({replay.agentBuilds.A.chassis}/{replay.agentBuilds.A.arms}/{replay.agentBuilds.A.weapon})
                        </span>
                      )}
                      {" vs "}
                      <span className="text-red-400">{nameB}</span>
                      {replay.agentBuilds?.B && (
                        <span className="text-red-400/50 text-[10px] ml-1">
                          ({replay.agentBuilds.B.chassis}/{replay.agentBuilds.B.arms}/{replay.agentBuilds.B.weapon})
                        </span>
                      )}
                    </div>
                    <div className="font-mono text-lg font-bold">
                      {replay.result.winner !== null ? (
                        <span
                          className={
                            replay.result.winner === 0
                              ? "text-blue-400"
                              : "text-red-400"
                          }
                        >
                          {replay.result.winner === 0 ? nameA : nameB} WINS
                        </span>
                      ) : (
                        <span className="text-yellow-400">DRAW</span>
                      )}
                    </div>
                    <div className="text-gray-500 text-xs mt-1 flex gap-3 font-mono">
                      <span className="uppercase">
                        {replay.result.reason.replace("_", " ")}
                      </span>
                      <span>
                        {mins}:{secs.toString().padStart(2, "0")}
                      </span>
                      <span>{replay.frameCount} frames</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-xs text-gray-500 font-mono">
                      {new Date(replay.timestamp).toLocaleDateString()}{" "}
                      {new Date(replay.timestamp).toLocaleTimeString()}
                    </div>
                    <div className="text-gray-500 group-hover:text-blue-400 transition-colors text-xl">
                      &#9654;
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}
