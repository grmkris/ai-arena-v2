/** Viewer-side types for arena state received via WebSocket */

export interface RobotBuild {
  chassis: "light" | "medium" | "heavy";
  arms: "short" | "standard" | "long";
  weapon: "rapid" | "standard" | "heavy";
}

export interface ViewerRobotState {
  id: string;
  build?: RobotBuild;
  position: [number, number, number];
  rotation: [number, number, number, number]; // quaternion xyzw
  armAngles: [number, number]; // [left, right]
}

/** Projectile state for viewer rendering */
export interface ViewerProjectileState {
  position: [number, number, number];
  ownerId: 0 | 1;
}

/** Agent thoughts for Mind Games mode */
export interface AgentThoughts {
  thought: string | null;
  privateThought: string | null;
}

export interface ViewerStateMessage {
  type: "state";
  tick: number;
  time: number;
  robots: [ViewerRobotState, ViewerRobotState];
  matchPhase: "waiting" | "countdown" | "active" | "finished";
  projectiles?: ViewerProjectileState[];
  thoughts?: {
    A: AgentThoughts;
    B: AgentThoughts;
  };
  round?: number;
  agentNames?: { A: string; B: string };
  builds?: { A: RobotBuild; B: RobotBuild };
}

export interface MatchEndMessage {
  type: "match_end";
  winner: 0 | 1 | null;
  reason: "ring_out" | "timeout" | "disconnect";
}

/** Lobby state broadcast by server */
export interface LobbyStateMessage {
  type: "lobby";
  queue: Array<{ name: string; position: number; build?: RobotBuild }>;
  currentMatch: {
    agentA: string;
    agentB: string;
    phase: string;
    tick: number;
    time: number;
  } | null;
}

/** Leaderboard entry from REST API */
export interface LeaderboardEntry {
  rank: number;
  agentName: string;
  displayName: string;
  wins: number;
  losses: number;
  draws: number;
  elo: number;
  matches: number;
  winRate: number;
}

/** Match history entry from REST API */
export interface MatchHistoryEntry {
  matchId: string;
  timestamp: string;
  agentA: string;
  agentB: string;
  winner: 0 | 1 | null;
  reason: string;
  durationS: number;
}

export type ServerViewerMessage = ViewerStateMessage | MatchEndMessage | LobbyStateMessage;
