import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";

const ArenaPage = lazy(() => import("./pages/ArenaPage"));
const JoinPage = lazy(() => import("./pages/JoinPage"));
const LeaderboardPage = lazy(() => import("./pages/LeaderboardPage"));
const ReplaysPage = lazy(() => import("./pages/ReplaysPage"));
const ReplayPlayerPage = lazy(() => import("./pages/ReplayPlayerPage"));

function Loading() {
  return (
    <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center">
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}

export function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/" element={<ArenaPage />} />
        <Route path="/join" element={<JoinPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/replays" element={<ReplaysPage />} />
        <Route path="/replays/:id" element={<ReplayPlayerPage />} />
      </Routes>
    </Suspense>
  );
}
