import type { RobotBuild } from "./builds.js";

/** 3D vector — plain serializable object */
export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

/** Quaternion rotation */
export interface Quat {
  x: number;
  y: number;
  z: number;
  w: number;
}

/** Rigid body state snapshot (serializable) */
export interface BodyState {
  position: Vec3;
  rotation: Quat;
  linvel: Vec3;
  angvel: Vec3;
}

/** Per-arm state */
export interface ArmState {
  body: BodyState;
  currentAngle: number; // radians, actual joint angle
  targetAngle: number; // normalized [-1, 1]
}

/** Complete robot state for one agent */
export interface RobotState {
  id: AgentId;
  build: RobotBuild;
  chassis: BodyState;
  leftArm: ArmState;
  rightArm: ArmState;
  isAlive: boolean;
}

/** An action submitted by an agent */
export interface AgentAction {
  leftArmTarget: number; // [-1, 1] arm swing
  rightArmTarget: number; // [-1, 1] arm swing
  /** Forward/backward thrust in facing direction. -1 = full reverse, 1 = full forward */
  driveForce?: number;
  /** Yaw rotation. -1 = turn left, 1 = turn right */
  turnRate?: number;
  /** Fire a knockback projectile (3s cooldown) */
  shoot?: boolean;
  /** Public thought — visible to opponent AND spectators (for mind games) */
  thought?: string;
  /** Private thought — visible to spectators ONLY (inner monologue) */
  privateThought?: string;
}

/** Projectile state snapshot */
export interface ProjectileState {
  id: number;
  ownerId: AgentId;
  position: Vec3;
  velocity: Vec3;
  ticksRemaining: number;
}

/** Compact projectile for viewer/replay */
export interface ViewerProjectileState {
  position: [number, number, number];
  ownerId: 0 | 1;
}

/** Pre-computed tactical summary for LLM agents */
export interface TacticalContext {
  distanceToOpponent: number;
  myDistFromCenter: number;
  opponentDistFromCenter: number;
  closingSpeed: number;
  mySpeed: number;
  opponentSpeed: number;
  timeRemainingS: number;
  round: number;
  /** My chassis facing angle in radians (0 = +Z axis) */
  myFacingAngle: number;
  /** Opponent facing angle in radians */
  opponentFacingAngle: number;
  /** Angle from my facing direction to opponent position (radians, + = right, - = left) */
  angleToOpponent: number;
  /** Seconds until I can shoot again (0 = ready) */
  myCooldownS: number;
  /** Seconds until opponent can shoot again (0 = ready) */
  opponentCooldownS: number;
  /** Number of projectiles currently heading toward me */
  incomingProjectiles: number;
  /** My robot build */
  myBuild: RobotBuild;
  /** Opponent's robot build */
  opponentBuild: RobotBuild;
}

/** Agent thought state for viewer/replay */
export interface AgentThoughts {
  thought: string | null;
  privateThought: string | null;
}

/** Full world snapshot at a given tick */
export interface WorldState {
  tick: number;
  elapsed: number; // seconds since match start
  robots: [RobotState, RobotState];
  projectiles: ProjectileState[];
  matchPhase: MatchPhase;
}

/** Agent identifier: 0 or 1 */
export type AgentId = 0 | 1;

/** Match lifecycle phases */
export type MatchPhase = "waiting" | "countdown" | "active" | "finished";

/** Match outcome */
export interface MatchResult {
  winner: AgentId | null; // null = draw
  reason: "ring_out" | "timeout" | "disconnect";
  finalTick: number;
}

/** Viewer-optimized state (sent at VIEWER_BROADCAST_RATE) */
export interface ViewerRobotState {
  id: string;
  build?: RobotBuild;
  position: [number, number, number];
  rotation: [number, number, number, number];
  armAngles: [number, number];
}

export interface ViewerState {
  type: "state";
  tick: number;
  time: number;
  robots: [ViewerRobotState, ViewerRobotState];
  matchPhase: MatchPhase;
  /** Active projectiles */
  projectiles?: ViewerProjectileState[];
  /** Agent thoughts for Mind Games mode */
  thoughts?: {
    A: AgentThoughts;
    B: AgentThoughts;
  };
  /** Current decision round */
  round?: number;
  /** Agent names */
  agentNames?: { A: string; B: string };
  /** Robot builds */
  builds?: { A: RobotBuild; B: RobotBuild };
}

// ═══════════════════════════════════════════════
// HTTP Agent API Response Types
// ═══════════════════════════════════════════════

/** Response from POST /api/join */
export interface JoinResponse {
  token: string;
  position: number;
  build: RobotBuild;
  config: {
    arenaRadius: number;
    tickRate: number;
    matchDurationS: number;
  };
}

/** Response from GET /api/game-state */
export interface GameStateResponse {
  status: "waiting" | "queued" | "countdown" | "active" | "finished";
  tick?: number;
  elapsed?: number;
  you?: AgentId;
  robots?: [RobotState, RobotState];
  projectiles?: ProjectileState[];
  matchPhase?: MatchPhase;
  tactical?: TacticalContext;
  yourLastAction?: AgentAction;
  opponentLastThought?: string | null;
  // Build info
  myBuild?: RobotBuild;
  opponentBuild?: RobotBuild;
  // Queue info (when status = "queued")
  position?: number;
  queueSize?: number;
  room?: string;
  // Turn-based state
  turn?: number;
  awaitingAction?: boolean;
  // Finished state
  winner?: AgentId | null;
  reason?: string;
  message?: string;
}

/** Response from POST /api/action */
export interface ActionResponse {
  ok: boolean;
  tick: number;
  turn: number;
}

// ═══════════════════════════════════════════════
// Lobby / Leaderboard Types
// ═══════════════════════════════════════════════

/** Leaderboard entry for a single agent */
export interface LeaderboardEntry {
  agentName: string;
  displayName: string;
  wins: number;
  losses: number;
  draws: number;
  elo: number;
  matches: number;
  winRate: number;
}

/** Match history entry */
export interface MatchHistoryEntry {
  matchId: string;
  timestamp: string;
  agentA: string;
  agentB: string;
  winner: AgentId | null;
  reason: string;
  durationS: number;
}

/** Queue entry visible to viewers */
export interface QueueEntry {
  name: string;
  position: number;
  build: RobotBuild;
}

/** Lobby state broadcast to spectators */
export interface LobbyState {
  type: "lobby";
  queue: QueueEntry[];
  currentMatch: {
    agentA: string;
    agentB: string;
    phase: MatchPhase;
    tick: number;
    time: number;
  } | null;
  roomsWaiting?: number;
}
