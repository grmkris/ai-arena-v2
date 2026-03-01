import { useEffect, useState, useRef, useCallback, lazy, Suspense } from "react";
import { useParams, Link } from "react-router-dom";

const ReplayArena = lazy(() =>
  import("../components/ReplayArena").then((m) => ({ default: m.ReplayArena }))
);

interface AgentThoughts {
  thought: string | null;
  privateThought: string | null;
}

interface RobotBuild {
  chassis: "light" | "medium" | "heavy";
  arms: "short" | "standard" | "long";
  weapon: "rapid" | "standard" | "heavy";
}

interface ViewerRobotFrame {
  position: [number, number, number];
  rotation: [number, number, number, number];
  armAngles: [number, number];
  build?: RobotBuild;
}

interface ViewerFrame {
  tick: number;
  time: number;
  robots: [ViewerRobotFrame, ViewerRobotFrame];
  thoughts?: { A: AgentThoughts; B: AgentThoughts };
  round?: number;
}

interface ReplayData {
  matchId: string;
  timestamp: string;
  result: { winner: number | null; reason: string; finalTick: number };
  viewerFrames: ViewerFrame[];
  agentNames?: { A: string; B: string };
  agentBuilds?: { A: RobotBuild; B: RobotBuild };
}

export default function ReplayPlayerPage() {
  const { id } = useParams<{ id: string }>();

  const [replay, setReplay] = useState<ReplayData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Playback state
  const [frameIndex, setFrameIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const animFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const accumulatorRef = useRef<number>(0);

  // Load replay data
  useEffect(() => {
    fetch(`/api/replays/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data) => {
        setReplay(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Replay not found");
        setLoading(false);
      });
  }, [id]);

  // Playback loop
  useEffect(() => {
    if (!playing || !replay) return;

    const totalFrames = replay.viewerFrames.length;
    const msPerFrame = (1000 / 60) / speed;

    lastTimeRef.current = performance.now();
    accumulatorRef.current = 0;

    function tick(now: number) {
      const dt = now - lastTimeRef.current;
      lastTimeRef.current = now;
      accumulatorRef.current += dt;

      while (accumulatorRef.current >= msPerFrame) {
        accumulatorRef.current -= msPerFrame;
        setFrameIndex((prev) => {
          if (prev >= totalFrames - 1) {
            setPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }

      animFrameRef.current = requestAnimationFrame(tick);
    }

    animFrameRef.current = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(animFrameRef.current);
  }, [playing, replay, speed]);

  const togglePlay = useCallback(() => {
    if (!replay) return;
    if (frameIndex >= replay.viewerFrames.length - 1) {
      setFrameIndex(0);
    }
    setPlaying((p) => !p);
  }, [replay, frameIndex]);

  const restart = useCallback(() => {
    setFrameIndex(0);
    setPlaying(false);
  }, []);

  const currentFrame = replay?.viewerFrames[frameIndex] ?? null;
  const totalFrames = replay?.viewerFrames.length ?? 0;
  const nameA = replay?.agentNames?.A ?? "Robot A";
  const nameB = replay?.agentNames?.B ?? "Robot B";

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0a0a1a] text-white flex items-center justify-center">
        <div className="font-mono text-gray-400">Loading replay...</div>
      </main>
    );
  }

  if (error || !replay) {
    return (
      <main className="min-h-screen bg-[#0a0a1a] text-white flex flex-col items-center justify-center gap-4">
        <div className="font-mono text-red-400">{error || "Unknown error"}</div>
        <Link to="/replays" className="text-blue-400 hover:underline font-mono text-sm">
          Back to replays
        </Link>
      </main>
    );
  }

  return (
    <main className="relative w-screen h-screen bg-[#0a0a1a]">
      <Suspense fallback={null}>
        <ReplayArena frame={currentFrame} agentBuilds={replay.agentBuilds} />
      </Suspense>

      {/* Top HUD */}
      <div className="absolute top-0 left-0 right-0 z-10 pointer-events-none">
        <div className="flex justify-between items-start p-4">
          <Link
            to="/replays"
            className="bg-black/60 backdrop-blur rounded-lg px-3 py-2 pointer-events-auto hover:bg-white/10 transition-colors"
          >
            <span className="text-xs font-mono text-gray-300">&larr; BACK</span>
          </Link>

          <div className="bg-black/60 backdrop-blur rounded-lg px-4 py-2 text-center">
            <div className="text-lg font-mono font-bold text-yellow-400">REPLAY</div>
            <div className="text-xs text-gray-400 font-mono">
              TICK {currentFrame?.tick ?? 0} / {replay.result.finalTick}
              {currentFrame?.round != null && (
                <span className="ml-2 text-gray-500">R{currentFrame.round}</span>
              )}
            </div>
          </div>

          <div className="bg-black/60 backdrop-blur rounded-lg px-3 py-2">
            <span className="text-xs font-mono">
              {replay.result.winner !== null ? (
                <span className={replay.result.winner === 0 ? "text-blue-400" : "text-red-400"}>
                  {replay.result.winner === 0 ? nameA : nameB} WINS
                </span>
              ) : (
                <span className="text-yellow-400">DRAW</span>
              )}
              {" "}
              <span className="text-gray-600">({replay.result.reason})</span>
            </span>
          </div>
        </div>

        <div className="flex justify-between px-8 mt-2">
          <div className="bg-blue-600/60 backdrop-blur rounded-lg px-4 py-2">
            <span className="text-sm font-bold text-white">{nameA}</span>
            {replay.agentBuilds?.A && (
              <div className="text-[10px] text-blue-200/70 font-mono mt-0.5">
                {replay.agentBuilds.A.chassis} / {replay.agentBuilds.A.arms} / {replay.agentBuilds.A.weapon}
              </div>
            )}
          </div>
          <div className="bg-red-600/60 backdrop-blur rounded-lg px-4 py-2">
            <span className="text-sm font-bold text-white">{nameB}</span>
            {replay.agentBuilds?.B && (
              <div className="text-[10px] text-red-200/70 font-mono mt-0.5">
                {replay.agentBuilds.B.chassis} / {replay.agentBuilds.B.arms} / {replay.agentBuilds.B.weapon}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Thought bubbles during replay */}
      {currentFrame?.thoughts && (
        <div className="absolute bottom-28 left-0 right-0 z-10 pointer-events-none">
          <div className="flex justify-between items-end px-4 gap-4">
            <ReplayThoughtPanel
              name={nameA}
              thought={currentFrame.thoughts.A.thought}
              privateThought={currentFrame.thoughts.A.privateThought}
              color="blue"
              align="left"
            />
            {currentFrame.round != null && (
              <div className="flex-shrink-0 bg-black/40 backdrop-blur rounded-lg px-3 py-1 mb-2">
                <span className="text-xs font-mono text-gray-400">
                  ROUND {currentFrame.round}
                </span>
              </div>
            )}
            <ReplayThoughtPanel
              name={nameB}
              thought={currentFrame.thoughts.B.thought}
              privateThought={currentFrame.thoughts.B.privateThought}
              color="red"
              align="right"
            />
          </div>
        </div>
      )}

      {/* Bottom playback controls */}
      <div className="absolute bottom-0 left-0 right-0 z-10 p-4">
        <div className="max-w-2xl mx-auto bg-black/80 backdrop-blur-lg rounded-xl px-6 py-4 border border-white/10">
          <div className="mb-3">
            <input
              type="range"
              min={0}
              max={Math.max(0, totalFrames - 1)}
              value={frameIndex}
              onChange={(e) => {
                setFrameIndex(Number(e.target.value));
                setPlaying(false);
              }}
              className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={restart}
              className="text-gray-400 hover:text-white font-mono text-sm px-3 py-1 rounded hover:bg-white/10 transition-colors"
            >
              RESTART
            </button>

            <button
              onClick={togglePlay}
              className="bg-blue-600 hover:bg-blue-500 text-white font-mono font-bold px-6 py-2 rounded-lg transition-colors text-sm"
            >
              {playing ? "PAUSE" : frameIndex >= totalFrames - 1 ? "REPLAY" : "PLAY"}
            </button>

            <div className="flex items-center gap-2">
              {[0.25, 0.5, 1, 2].map((s) => (
                <button
                  key={s}
                  onClick={() => setSpeed(s)}
                  className={`font-mono text-xs px-2 py-1 rounded transition-colors ${
                    speed === s
                      ? "bg-blue-600 text-white"
                      : "text-gray-400 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function ReplayThoughtPanel({
  name,
  thought,
  privateThought,
  color,
  align,
}: {
  name: string;
  thought: string | null;
  privateThought: string | null;
  color: "blue" | "red";
  align: "left" | "right";
}) {
  const borderColor =
    color === "blue" ? "border-blue-500/30" : "border-red-500/30";
  const bgColor =
    color === "blue" ? "bg-blue-950/60" : "bg-red-950/60";
  const nameColor =
    color === "blue" ? "text-blue-400" : "text-red-400";
  const textAlign = align === "left" ? "text-left" : "text-right";

  const hasContent = thought || privateThought;

  return (
    <div
      className={`max-w-[280px] w-full ${bgColor} backdrop-blur-md rounded-xl border ${borderColor} p-3 transition-all duration-300 ${
        hasContent ? "opacity-100" : "opacity-40"
      }`}
    >
      <div className={`text-xs font-mono font-bold ${nameColor} mb-1.5 ${textAlign}`}>
        {name}
      </div>

      {thought ? (
        <div className={`${textAlign} mb-1.5`}>
          <span className="text-sm text-white leading-snug">
            &ldquo;{thought}&rdquo;
          </span>
        </div>
      ) : (
        <div className={`${textAlign} mb-1.5`}>
          <span className="text-xs text-gray-500 italic">no thought</span>
        </div>
      )}

      {privateThought && (
        <div className={`${textAlign} border-t border-white/5 pt-1.5 mt-1`}>
          <span className="text-[10px] text-gray-500 uppercase tracking-wider block mb-0.5">
            inner monologue
          </span>
          <span className="text-xs text-gray-400 italic leading-snug">
            {privateThought}
          </span>
        </div>
      )}
    </div>
  );
}
