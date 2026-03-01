import { TICK_DURATION_MS } from "../shared/constants.js";
import type { WorldState, MatchResult } from "../shared/types.js";
import type { Simulation, ActionProvider } from "./simulation.js";

export interface GameLoopCallbacks {
  onTick?: (state: WorldState) => void;
  onMatchEnd?: (result: MatchResult) => void;
}

/**
 * Fixed-timestep game loop.
 * Runs the simulation at TICK_RATE Hz with wall-clock compensation.
 */
export class GameLoop {
  private running = false;
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private sim: Simulation,
    private actionProvider: ActionProvider,
    private callbacks: GameLoopCallbacks = {},
  ) {}

  start(): void {
    this.running = true;
    this.scheduleTick();
  }

  stop(): void {
    this.running = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  get isRunning(): boolean {
    return this.running;
  }

  private scheduleTick(): void {
    if (!this.running) return;

    const startTime = performance.now();

    const state = this.sim.step(this.actionProvider);
    this.callbacks.onTick?.(state);

    if (this.sim.phase === "finished") {
      this.running = false;
      const result = this.sim.matchResult;
      if (result) this.callbacks.onMatchEnd?.(result);
      return;
    }

    const elapsed = performance.now() - startTime;
    const delay = Math.max(0, TICK_DURATION_MS - elapsed);
    this.timer = setTimeout(() => this.scheduleTick(), delay);
  }

  runSync(maxTicks: number): WorldState | null {
    let lastState: WorldState | null = null;

    for (let i = 0; i < maxTicks; i++) {
      const state = this.sim.step(this.actionProvider);
      lastState = state;
      this.callbacks.onTick?.(state);

      if (this.sim.phase === "finished") {
        const result = this.sim.matchResult;
        if (result) this.callbacks.onMatchEnd?.(result);
        break;
      }
    }

    return lastState;
  }

  /**
   * Run a single turn: advance N ticks synchronously.
   * Returns true if the match ended during this turn.
   */
  runTurn(ticksPerTurn: number): boolean {
    for (let i = 0; i < ticksPerTurn; i++) {
      const state = this.sim.step(this.actionProvider);
      this.callbacks.onTick?.(state);

      if (this.sim.phase === "finished") {
        const result = this.sim.matchResult;
        if (result) this.callbacks.onMatchEnd?.(result);
        return true;
      }
    }
    return false;
  }
}
