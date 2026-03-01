import { mkdir, writeFile, readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import type { AgentAction, AgentThoughts, MatchResult } from "../shared/types.js";
import type { RobotBuild } from "../shared/builds.js";
import { env } from "../env.js";

export interface ReplayFrame {
  tick: number;
  actions: [AgentAction, AgentAction];
}

export interface ViewerProjectileFrame {
  position: [number, number, number];
  ownerId: 0 | 1;
}

export interface ViewerFrame {
  tick: number;
  time: number;
  robots: [ViewerRobotFrame, ViewerRobotFrame];
  projectiles?: ViewerProjectileFrame[];
  thoughts?: { A: AgentThoughts; B: AgentThoughts };
  round?: number;
}

export interface ViewerRobotFrame {
  position: [number, number, number];
  rotation: [number, number, number, number];
  armAngles: [number, number];
  build?: RobotBuild;
}

export interface ReplayFile {
  version: 2;
  matchId: string;
  timestamp: string;
  result: MatchResult;
  frames: ReplayFrame[];
  viewerFrames: ViewerFrame[];
  agentNames?: { A: string; B: string };
  agentBuilds?: { A: RobotBuild; B: RobotBuild };
}

export interface ReplaySummary {
  matchId: string;
  timestamp: string;
  result: MatchResult;
  frameCount: number;
  agentNames?: { A: string; B: string };
  agentBuilds?: { A: RobotBuild; B: RobotBuild };
}

export async function saveReplay(
  matchId: string,
  result: MatchResult,
  history: ReadonlyArray<{ tick: number; actions: [AgentAction, AgentAction] }>,
  viewerFrames: ReadonlyArray<ViewerFrame>,
  agentNames?: { A: string; B: string },
  agentBuilds?: { A: RobotBuild; B: RobotBuild },
): Promise<string> {
  await mkdir(env.REPLAY_DIR, { recursive: true });

  const replay: ReplayFile = {
    version: 2,
    matchId,
    timestamp: new Date().toISOString(),
    result,
    frames: history.map((h) => ({ tick: h.tick, actions: h.actions })),
    viewerFrames: viewerFrames as ViewerFrame[],
    agentNames,
    agentBuilds,
  };

  const filePath = join(env.REPLAY_DIR, `${matchId}.json`);
  await writeFile(filePath, JSON.stringify(replay), "utf-8");
  console.log(`[Replay] Saved ${replay.frames.length} frames to ${filePath}`);
  return filePath;
}

export async function loadReplay(
  matchId: string,
): Promise<ReplayFile | null> {
  try {
    const filePath = join(env.REPLAY_DIR, `${matchId}.json`);
    const content = await readFile(filePath, "utf-8");
    return JSON.parse(content) as ReplayFile;
  } catch {
    return null;
  }
}

export async function listReplaySummaries(): Promise<ReplaySummary[]> {
  try {
    await mkdir(env.REPLAY_DIR, { recursive: true });
    const files = await readdir(env.REPLAY_DIR);
    const jsonFiles = files.filter((f) => f.endsWith(".json"));

    const summaries: ReplaySummary[] = [];
    for (const file of jsonFiles) {
      try {
        const content = await readFile(join(env.REPLAY_DIR, file), "utf-8");
        const replay = JSON.parse(content) as ReplayFile;
        summaries.push({
          matchId: replay.matchId,
          timestamp: replay.timestamp,
          result: replay.result,
          frameCount: replay.viewerFrames?.length ?? replay.frames.length,
          agentNames: replay.agentNames,
          agentBuilds: replay.agentBuilds,
        });
      } catch {
        // skip corrupt files
      }
    }

    summaries.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
    return summaries;
  } catch {
    return [];
  }
}
