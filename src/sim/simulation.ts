import RAPIER from "@dimforge/rapier3d-compat";
import type { AgentAction, AgentId, MatchPhase, MatchResult, WorldState } from "../shared/types.js";
import type { RobotConfig } from "../shared/builds.js";
import {
  TICK_RATE,
  TICK_DURATION_S,
  MATCH_DURATION_TICKS,
  RING_OUT_Y_THRESHOLD,
  ARENA_RADIUS,
  RING_OUT_DISTANCE_MARGIN,
  PROJECTILE_LIFETIME_TICKS,
  PROJECTILE_RADIUS,
  COUNTDOWN_DURATION_TICKS,
} from "../shared/constants.js";
import { buildRobotConfig } from "../shared/builds.js";
import { Arena } from "./arena.js";
import {
  RobotFactory,
  applyArmAction,
  applyMovementAction,
  getFacingDirection,
} from "./robot-factory.js";
import type { Robot } from "./robot-factory.js";
import { extractWorldState } from "./state-extractor.js";

const NO_OP: AgentAction = {
  leftArmTarget: 0,
  rightArmTarget: 0,
  driveForce: 0,
  turnRate: 0,
  shoot: false,
};

export type ActionProvider = (
  agentId: AgentId,
  state: WorldState,
) => AgentAction;

/** Internal projectile representation */
export interface Projectile {
  id: number;
  ownerId: AgentId;
  body: RAPIER.RigidBody;
  velocity: { x: number; z: number };
  ticksAlive: number;
  maxTicks: number;
  hit: boolean;
}

/** Serializable projectile snapshot (for state extraction) */
export interface ProjectileSnapshot {
  id: number;
  ownerId: AgentId;
  position: { x: number; y: number; z: number };
  velocity: { x: number; y: number; z: number };
  ticksRemaining: number;
}

/**
 * Core simulation class.
 * Owns the Rapier world, robots, arena, projectiles, and all game logic.
 * Zero networking code — this is pure simulation.
 */
export class Simulation {
  private world!: RAPIER.World;
  private robots!: [Robot, Robot];
  private configs!: [RobotConfig, RobotConfig];
  private tick = 0;
  private matchPhase: MatchPhase = "countdown";
  private countdownTicks = COUNTDOWN_DURATION_TICKS;
  private lastActions: [AgentAction, AgentAction] = [
    { ...NO_OP },
    { ...NO_OP },
  ];
  private result: MatchResult | null = null;
  private tickHistory: Array<{
    tick: number;
    actions: [AgentAction, AgentAction];
  }> = [];

  private projectiles: Projectile[] = [];
  private nextProjectileId = 0;
  private cooldowns: [number, number] = [0, 0];

  private knockback: [{ x: number; z: number }, { x: number; z: number }] = [
    { x: 0, z: 0 },
    { x: 0, z: 0 },
  ];
  private stunTicks: [number, number] = [0, 0];

  async init(configs?: [RobotConfig, RobotConfig]): Promise<void> {
    this.configs = configs ?? [buildRobotConfig(), buildRobotConfig()];

    this.world = new RAPIER.World(new RAPIER.Vector3(0, -9.81, 0));
    new Arena(this.world); // creates floor colliders as side effect

    const factory = new RobotFactory(this.world);
    const spawnOffset = ARENA_RADIUS * 0.4;

    const robot0 = factory.create(0, -spawnOffset, 0, Math.PI / 2, this.configs[0]);
    const robot1 = factory.create(1, spawnOffset, 0, -Math.PI / 2, this.configs[1]);
    this.robots = [robot0, robot1];
  }

  step(actionProvider: ActionProvider): WorldState {
    const preState = extractWorldState(
      this.tick,
      this.robots,
      this.lastActions,
      this.matchPhase,
      this.getProjectileSnapshots(),
    );

    if (this.matchPhase === "countdown") {
      this.countdownTicks--;
      if (this.countdownTicks <= 0) {
        this.matchPhase = "active";
        this.tick = 0;
      }
    }

    if (this.matchPhase === "active") {
      const action0 = actionProvider(0, preState);
      const action1 = actionProvider(1, preState);
      this.lastActions = [action0, action1];

      this.tickHistory.push({
        tick: this.tick,
        actions: [{ ...action0 }, { ...action1 }],
      });

      applyArmAction(this.robots[0], action0);
      applyArmAction(this.robots[1], action1);

      this.handleShoot(0, action0);
      this.handleShoot(1, action1);

      this.advanceProjectiles();

      if (this.cooldowns[0] > 0) this.cooldowns[0]--;
      if (this.cooldowns[1] > 0) this.cooldowns[1]--;
    }

    this.world.step();

    if (this.matchPhase === "active") {
      if (this.stunTicks[0] <= 0) {
        applyMovementAction(this.robots[0], this.lastActions[0]);
      }
      if (this.stunTicks[1] <= 0) {
        applyMovementAction(this.robots[1], this.lastActions[1]);
      }
      if (this.stunTicks[0] > 0) this.stunTicks[0]--;
      if (this.stunTicks[1] > 0) this.stunTicks[1]--;
    }

    this.applyKnockback();
    this.clampRobotVelocities();
    this.detectProjectileHits();
    this.cleanupProjectiles();

    this.tick++;

    const postState = extractWorldState(
      this.tick,
      this.robots,
      this.lastActions,
      this.matchPhase,
      this.getProjectileSnapshots(),
    );

    this.checkWinConditions(postState);
    return postState;
  }

  private clampRobotVelocities(): void {
    for (const robot of this.robots) {
      const config = robot.config;
      const maxLinearSpeed = config.maxSpeed * 2.5;
      const maxAngularSpeed = config.maxAngularSpeed * 2;

      const vel = robot.chassis.linvel();
      const hSpeed = Math.hypot(vel.x, vel.z);
      if (hSpeed > maxLinearSpeed) {
        const factor = maxLinearSpeed / hSpeed;
        robot.chassis.setLinvel(
          new RAPIER.Vector3(vel.x * factor, vel.y, vel.z * factor),
          true,
        );
      }

      const angvel = robot.chassis.angvel();
      if (Math.abs(angvel.y) > maxAngularSpeed) {
        robot.chassis.setAngvel(
          new RAPIER.Vector3(
            angvel.x,
            Math.sign(angvel.y) * maxAngularSpeed,
            angvel.z,
          ),
          true,
        );
      }

      for (const arm of [robot.leftArm, robot.rightArm]) {
        const armVel = arm.linvel();
        const armSpeed = Math.hypot(armVel.x, armVel.z);
        if (armSpeed > maxLinearSpeed * 1.5) {
          const f = (maxLinearSpeed * 1.5) / armSpeed;
          arm.setLinvel(
            new RAPIER.Vector3(armVel.x * f, armVel.y, armVel.z * f),
            true,
          );
        }
      }
    }
  }

  private handleShoot(agentId: AgentId, action: AgentAction): void {
    if (!action.shoot) return;
    if (this.cooldowns[agentId] > 0) return;

    const robot = this.robots[agentId];
    const config = robot.config;
    const pos = robot.chassis.translation();
    const [fx, fz] = getFacingDirection(robot.chassis);

    const spawnDist = config.chassisHalfExtents.z + PROJECTILE_RADIUS + 0.15;
    const spawnX = pos.x + fx * spawnDist;
    const spawnZ = pos.z + fz * spawnDist;
    const spawnY = pos.y;

    const bodyDesc = RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(
      spawnX,
      spawnY,
      spawnZ,
    );
    const body = this.world.createRigidBody(bodyDesc);

    const colliderDesc = RAPIER.ColliderDesc.ball(PROJECTILE_RADIUS).setSensor(true);
    this.world.createCollider(colliderDesc, body);

    this.projectiles.push({
      id: this.nextProjectileId++,
      ownerId: agentId,
      body,
      velocity: {
        x: fx * config.projectileSpeed,
        z: fz * config.projectileSpeed,
      },
      ticksAlive: 0,
      maxTicks: PROJECTILE_LIFETIME_TICKS,
      hit: false,
    });

    const cooldownTicks = Math.ceil(
      config.projectileCooldownMs / (1000 / TICK_RATE),
    );
    this.cooldowns[agentId] = cooldownTicks;
  }

  private advanceProjectiles(): void {
    for (const proj of this.projectiles) {
      if (proj.hit) continue;
      const pos = proj.body.translation();
      const newX = pos.x + proj.velocity.x * TICK_DURATION_S;
      const newZ = pos.z + proj.velocity.z * TICK_DURATION_S;
      proj.body.setNextKinematicTranslation(
        new RAPIER.Vector3(newX, pos.y, newZ),
      );
      proj.ticksAlive++;
    }
  }

  private detectProjectileHits(): void {
    for (const proj of this.projectiles) {
      if (proj.hit) continue;

      const opponentId: AgentId = proj.ownerId === 0 ? 1 : 0;
      const opponent = this.robots[opponentId];
      const shooterConfig = this.configs[proj.ownerId];
      const victimConfig = this.configs[opponentId];

      const projPos = proj.body.translation();
      const oppPos = opponent.chassis.translation();
      const dx = projPos.x - oppPos.x;
      const dz = projPos.z - oppPos.z;
      const dist = Math.hypot(dx, dz);

      const hitRadius =
        PROJECTILE_RADIUS + victimConfig.chassisHalfExtents.x * 1.2;

      if (dist < hitRadius) {
        const pushDx = oppPos.x - projPos.x;
        const pushDz = oppPos.z - projPos.z;
        const pushDist = Math.hypot(pushDx, pushDz) || 1;

        const kbSpeed =
          (shooterConfig.projectileKnockbackImpulse / victimConfig.chassisMass) *
          victimConfig.knockbackMultiplier;
        this.knockback[opponentId].x += (pushDx / pushDist) * kbSpeed;
        this.knockback[opponentId].z += (pushDz / pushDist) * kbSpeed;

        this.stunTicks[opponentId] = victimConfig.stunTicks;
        proj.hit = true;
      }
    }
  }

  private applyKnockback(): void {
    const KNOCKBACK_DECAY = 0.93;

    for (const [idx, robot] of this.robots.entries()) {
      const kb = this.knockback[idx]!;
      const kbMag = Math.hypot(kb.x, kb.z);
      if (kbMag < 0.05) {
        kb.x = 0;
        kb.z = 0;
        continue;
      }

      const vel = robot.chassis.linvel();
      robot.chassis.setLinvel(
        new RAPIER.Vector3(vel.x + kb.x, vel.y, vel.z + kb.z),
        true,
      );

      kb.x *= KNOCKBACK_DECAY;
      kb.z *= KNOCKBACK_DECAY;
    }
  }

  private cleanupProjectiles(): void {
    const toRemove: Projectile[] = [];
    for (const proj of this.projectiles) {
      if (proj.hit || proj.ticksAlive >= proj.maxTicks) {
        toRemove.push(proj);
      }
    }
    for (const proj of toRemove) {
      this.world.removeRigidBody(proj.body);
    }
    this.projectiles = this.projectiles.filter((p) => !toRemove.includes(p));
  }

  getProjectileSnapshots(): ProjectileSnapshot[] {
    return this.projectiles
      .filter((p) => !p.hit)
      .map((p) => {
        const pos = p.body.translation();
        return {
          id: p.id,
          ownerId: p.ownerId,
          position: { x: pos.x, y: pos.y, z: pos.z },
          velocity: { x: p.velocity.x, y: 0, z: p.velocity.z },
          ticksRemaining: p.maxTicks - p.ticksAlive,
        };
      });
  }

  private checkWinConditions(state: WorldState): void {
    if (this.matchPhase !== "active") return;

    const [r0, r1] = state.robots;
    const r0Dead = !r0.isAlive || this.isOutOfArena(r0.chassis.position);
    const r1Dead = !r1.isAlive || this.isOutOfArena(r1.chassis.position);

    if (r0Dead && r1Dead) {
      this.endMatch(null, "ring_out");
    } else if (r0Dead) {
      this.endMatch(1, "ring_out");
    } else if (r1Dead) {
      this.endMatch(0, "ring_out");
    } else if (this.tick >= MATCH_DURATION_TICKS) {
      const d0 = Math.hypot(r0.chassis.position.x, r0.chassis.position.z);
      const d1 = Math.hypot(r1.chassis.position.x, r1.chassis.position.z);
      const winner: AgentId | null = d0 < d1 ? 0 : d1 < d0 ? 1 : null;
      this.endMatch(winner, "timeout");
    }
  }

  private isOutOfArena(pos: { x: number; y: number; z: number }): boolean {
    const distFromCenter = Math.hypot(pos.x, pos.z);
    return (
      pos.y < RING_OUT_Y_THRESHOLD ||
      distFromCenter > ARENA_RADIUS + RING_OUT_DISTANCE_MARGIN
    );
  }

  private endMatch(
    winner: AgentId | null,
    reason: MatchResult["reason"],
  ): void {
    this.matchPhase = "finished";
    this.result = { winner, reason, finalTick: this.tick };
  }

  get currentTick(): number {
    return this.tick;
  }
  get phase(): MatchPhase {
    return this.matchPhase;
  }
  get matchResult(): MatchResult | null {
    return this.result;
  }
  get history(): ReadonlyArray<{
    tick: number;
    actions: [AgentAction, AgentAction];
  }> {
    return this.tickHistory;
  }
  get agentCooldowns(): [number, number] {
    return [...this.cooldowns] as [number, number];
  }
  get countdownRemaining(): number {
    return this.countdownTicks;
  }
  get robotConfigs(): [RobotConfig, RobotConfig] {
    return this.configs;
  }

  getWorldState(): WorldState {
    return extractWorldState(
      this.tick,
      this.robots,
      this.lastActions,
      this.matchPhase,
      this.getProjectileSnapshots(),
    );
  }

  destroy(): void {
    for (const proj of this.projectiles) {
      try {
        this.world.removeRigidBody(proj.body);
      } catch {
        // body may already be freed
      }
    }
    this.projectiles = [];
    this.world.free();
  }
}
