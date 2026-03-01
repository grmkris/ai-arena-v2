import type { TacticalContext, WorldState } from "../shared/types.js";
import type { RobotBuild } from "../shared/builds.js";
import { MATCH_DURATION_S, TICK_DURATION_S } from "../shared/constants.js";

function getFacingAngle(rot: {
  x: number;
  y: number;
  z: number;
  w: number;
}): number {
  const fw_x = 2 * (rot.x * rot.z + rot.w * rot.y);
  const fw_z = 1 - 2 * (rot.x * rot.x + rot.y * rot.y);
  return Math.atan2(fw_x, fw_z);
}

function normalizeAngle(angle: number): number {
  while (angle > Math.PI) angle -= 2 * Math.PI;
  while (angle < -Math.PI) angle += 2 * Math.PI;
  return angle;
}

/** Build tactical context from agent 0's perspective */
export function buildTacticalContext(
  state: WorldState,
  cooldowns: [number, number],
  buildA: RobotBuild,
  buildB: RobotBuild,
  round: number = 0,
): TacticalContext {
  const r0 = state.robots[0];
  const r1 = state.robots[1];

  const dx = r1.chassis.position.x - r0.chassis.position.x;
  const dz = r1.chassis.position.z - r0.chassis.position.z;
  const distToOpponent = Math.hypot(dx, dz);

  const myDistFromCenter = Math.hypot(
    r0.chassis.position.x,
    r0.chassis.position.z,
  );
  const opponentDistFromCenter = Math.hypot(
    r1.chassis.position.x,
    r1.chassis.position.z,
  );

  const relVelX = r1.chassis.linvel.x - r0.chassis.linvel.x;
  const relVelZ = r1.chassis.linvel.z - r0.chassis.linvel.z;
  const dirX = distToOpponent > 0.01 ? dx / distToOpponent : 0;
  const dirZ = distToOpponent > 0.01 ? dz / distToOpponent : 0;
  const closingSpeed = -(relVelX * dirX + relVelZ * dirZ);

  const mySpeed = Math.hypot(r0.chassis.linvel.x, r0.chassis.linvel.z);
  const opponentSpeed = Math.hypot(r1.chassis.linvel.x, r1.chassis.linvel.z);

  const myFacingAngle = getFacingAngle(r0.chassis.rotation);
  const opponentFacingAngle = getFacingAngle(r1.chassis.rotation);

  const dirToOpponent = Math.atan2(dx, dz);
  const angleToOpponent = normalizeAngle(dirToOpponent - myFacingAngle);

  const myCooldownS =
    Math.round(cooldowns[0] * TICK_DURATION_S * 100) / 100;
  const opponentCooldownS =
    Math.round(cooldowns[1] * TICK_DURATION_S * 100) / 100;

  const incomingProjectiles = (state.projectiles ?? []).filter(
    (p) => p.ownerId === 1,
  ).length;

  return {
    distanceToOpponent: Math.round(distToOpponent * 100) / 100,
    myDistFromCenter: Math.round(myDistFromCenter * 100) / 100,
    opponentDistFromCenter: Math.round(opponentDistFromCenter * 100) / 100,
    closingSpeed: Math.round(closingSpeed * 100) / 100,
    mySpeed: Math.round(mySpeed * 100) / 100,
    opponentSpeed: Math.round(opponentSpeed * 100) / 100,
    timeRemainingS: Math.round((MATCH_DURATION_S - state.elapsed) * 10) / 10,
    round,
    myFacingAngle: Math.round(myFacingAngle * 100) / 100,
    opponentFacingAngle: Math.round(opponentFacingAngle * 100) / 100,
    angleToOpponent: Math.round(angleToOpponent * 100) / 100,
    myCooldownS,
    opponentCooldownS,
    incomingProjectiles,
    myBuild: buildA,
    opponentBuild: buildB,
  };
}

/** Flip a tactical context from agent 0's perspective to agent 1's */
export function flipTactical(
  t: TacticalContext,
  state: WorldState,
): TacticalContext {
  const incomingForAgent1 = (state.projectiles ?? []).filter(
    (p) => p.ownerId === 0,
  ).length;

  const r0 = state.robots[0];
  const r1 = state.robots[1];
  const dx = r0.chassis.position.x - r1.chassis.position.x;
  const dz = r0.chassis.position.z - r1.chassis.position.z;
  const dirToOpponent = Math.atan2(dx, dz);
  const angleToOpponent1 = normalizeAngle(
    dirToOpponent - t.opponentFacingAngle,
  );

  return {
    ...t,
    myDistFromCenter: t.opponentDistFromCenter,
    opponentDistFromCenter: t.myDistFromCenter,
    mySpeed: t.opponentSpeed,
    opponentSpeed: t.mySpeed,
    myFacingAngle: t.opponentFacingAngle,
    opponentFacingAngle: t.myFacingAngle,
    angleToOpponent: Math.round(angleToOpponent1 * 100) / 100,
    myCooldownS: t.opponentCooldownS,
    opponentCooldownS: t.myCooldownS,
    incomingProjectiles: incomingForAgent1,
    myBuild: t.opponentBuild,
    opponentBuild: t.myBuild,
  };
}
