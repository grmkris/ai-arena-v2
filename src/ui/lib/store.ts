import { create } from "zustand";
import type {
  ViewerRobotState,
  ViewerProjectileState,
  ViewerStateMessage,
  MatchEndMessage,
  LobbyStateMessage,
  AgentThoughts,
  RobotBuild,
} from "./types";

interface ArenaStore {
  connected: boolean;
  setConnected: (v: boolean) => void;

  tick: number;
  time: number;
  matchPhase: "waiting" | "countdown" | "active" | "finished" | "disconnected";
  robots: [ViewerRobotState, ViewerRobotState] | null;

  winner: 0 | 1 | null;
  winReason: string | null;

  prevRobots: [ViewerRobotState, ViewerRobotState] | null;

  projectiles: ViewerProjectileState[];

  thoughts: { A: AgentThoughts; B: AgentThoughts } | null;
  round: number;
  agentNames: { A: string; B: string };
  builds: { A: RobotBuild; B: RobotBuild } | null;

  queue: Array<{ name: string; position: number; build?: RobotBuild }>;
  currentMatch: LobbyStateMessage["currentMatch"];

  updateState: (msg: ViewerStateMessage) => void;
  setMatchEnd: (msg: MatchEndMessage) => void;
  updateLobby: (msg: LobbyStateMessage) => void;
  reset: () => void;
}

export const useArenaStore = create<ArenaStore>((set) => ({
  connected: false,
  setConnected: (v) => set({ connected: v }),

  tick: 0,
  time: 0,
  matchPhase: "disconnected",
  robots: null,
  winner: null,
  winReason: null,
  prevRobots: null,
  projectiles: [],
  thoughts: null,
  round: 0,
  agentNames: { A: "Robot A", B: "Robot B" },
  builds: null,
  queue: [],
  currentMatch: null,

  updateState: (msg) =>
    set((state) => ({
      tick: msg.tick,
      time: msg.time,
      matchPhase: msg.matchPhase,
      prevRobots: state.robots,
      robots: msg.robots,
      projectiles: msg.projectiles ?? [],
      thoughts: msg.thoughts ?? state.thoughts,
      round: msg.round ?? state.round,
      agentNames: msg.agentNames ?? state.agentNames,
      builds: msg.builds ?? state.builds,
    })),

  setMatchEnd: (msg) =>
    set({
      matchPhase: "finished",
      winner: msg.winner,
      winReason: msg.reason,
    }),

  updateLobby: (msg) =>
    set({
      queue: msg.queue,
      currentMatch: msg.currentMatch,
    }),

  reset: () =>
    set({
      tick: 0,
      time: 0,
      matchPhase: "disconnected",
      robots: null,
      winner: null,
      winReason: null,
      prevRobots: null,
      projectiles: [],
      thoughts: null,
      round: 0,
      agentNames: { A: "Robot A", B: "Robot B" },
      builds: null,
      queue: [],
      currentMatch: null,
    }),
}));
