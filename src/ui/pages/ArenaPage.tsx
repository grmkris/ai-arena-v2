import { lazy, Suspense } from "react";
import { useMatchSocket } from "../hooks/useMatchSocket";
import { useArenaStore } from "../lib/store";
import { MatchHUD } from "../components/MatchHUD";
import { ThoughtBubbles } from "../components/ThoughtBubbles";
import { LobbyView } from "../components/LobbyView";
import { ErrorBoundary } from "../components/ErrorBoundary";

const Arena3D = lazy(() =>
  import("../components/Arena3D").then((mod) => ({ default: mod.Arena3D }))
);

export default function ArenaPage() {
  const matchPhase = useArenaStore((s) => s.matchPhase);

  useMatchSocket();

  const showLobby = matchPhase === "waiting" || matchPhase === "disconnected";
  const showArena = !showLobby;

  return (
    <ErrorBoundary>
      <main className="relative w-screen h-screen bg-[#0a0a1a]">
        <MatchHUD />
        {showLobby ? <LobbyView /> : <ThoughtBubbles />}
        {showArena && (
          <Suspense fallback={null}>
            <Arena3D />
          </Suspense>
        )}
      </main>
    </ErrorBoundary>
  );
}
