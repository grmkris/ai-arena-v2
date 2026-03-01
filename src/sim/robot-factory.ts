import RAPIER from "@dimforge/rapier3d-compat";
import type { AgentId, AgentAction } from "../shared/types.js";
import type { RobotConfig } from "../shared/builds.js";
import { ARM_ANGLE_MIN, ARM_ANGLE_MAX } from "../shared/constants.js";

/** A fully-constructed robot with physics bodies and joints */
export interface Robot {
  id: AgentId;
  config: RobotConfig;
  chassis: RAPIER.RigidBody;
  leftArm: RAPIER.RigidBody;
  rightArm: RAPIER.RigidBody;
  leftJoint: RAPIER.ImpulseJoint;
  rightJoint: RAPIER.ImpulseJoint;
}

/**
 * Factory for constructing robots in the physics world.
 * Each robot: 1 chassis (cuboid) + 2 arms (cuboid) connected by revolute joints.
 */
export class RobotFactory {
  constructor(private world: RAPIER.World) {}

  create(
    id: AgentId,
    spawnX: number,
    spawnZ: number,
    facingAngleY: number | undefined,
    config: RobotConfig,
  ): Robot {
    const che = config.chassisHalfExtents;
    const ahe = config.armHalfExtents;
    const spawnY = che.y + 0.05;

    // ── Chassis ──
    const chassisDesc =
      RAPIER.RigidBodyDesc.dynamic().setTranslation(spawnX, spawnY, spawnZ);

    if (facingAngleY !== undefined) {
      chassisDesc.setRotation({
        x: 0,
        y: Math.sin(facingAngleY / 2),
        z: 0,
        w: Math.cos(facingAngleY / 2),
      });
    }

    const chassis = this.world.createRigidBody(chassisDesc);

    const chassisVol = 8 * che.x * che.y * che.z;
    const chassisCollider = RAPIER.ColliderDesc.cuboid(che.x, che.y, che.z)
      .setDensity(config.chassisMass / chassisVol)
      .setFriction(0.8)
      .setRestitution(0.05);
    this.world.createCollider(chassisCollider, chassis);

    chassis.setLinearDamping(2.0);
    chassis.setAngularDamping(4.0);

    // ── Arm placement (account for chassis rotation!) ──
    const angle = facingAngleY ?? 0;
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);

    const leftLocalX = -(che.x + ahe.x);
    const leftArmWorldX = spawnX + leftLocalX * cosA;
    const leftArmWorldZ = spawnZ + leftLocalX * -sinA;
    const leftArm = this.createArmBody(
      leftArmWorldX,
      spawnY,
      leftArmWorldZ,
      facingAngleY,
      ahe,
      config.armMass,
    );

    const rightLocalX = che.x + ahe.x;
    const rightArmWorldX = spawnX + rightLocalX * cosA;
    const rightArmWorldZ = spawnZ + rightLocalX * -sinA;
    const rightArm = this.createArmBody(
      rightArmWorldX,
      spawnY,
      rightArmWorldZ,
      facingAngleY,
      ahe,
      config.armMass,
    );

    // ── Revolute Joints (rotate around Y axis) ──
    const leftJointData = RAPIER.JointData.revolute(
      new RAPIER.Vector3(-che.x, 0, 0),
      new RAPIER.Vector3(ahe.x, 0, 0),
      new RAPIER.Vector3(0, 1, 0),
    );
    leftJointData.limitsEnabled = true;
    leftJointData.limits = [ARM_ANGLE_MIN, ARM_ANGLE_MAX];
    const leftJoint = this.world.createImpulseJoint(
      leftJointData,
      chassis,
      leftArm,
      true,
    );

    const rightJointData = RAPIER.JointData.revolute(
      new RAPIER.Vector3(che.x, 0, 0),
      new RAPIER.Vector3(-ahe.x, 0, 0),
      new RAPIER.Vector3(0, 1, 0),
    );
    rightJointData.limitsEnabled = true;
    rightJointData.limits = [ARM_ANGLE_MIN, ARM_ANGLE_MAX];
    const rightJoint = this.world.createImpulseJoint(
      rightJointData,
      chassis,
      rightArm,
      true,
    );

    return { id, config, chassis, leftArm, rightArm, leftJoint, rightJoint };
  }

  private createArmBody(
    x: number,
    y: number,
    z: number,
    facingAngleY: number | undefined,
    ahe: { x: number; y: number; z: number },
    armMass: number,
  ): RAPIER.RigidBody {
    const desc = RAPIER.RigidBodyDesc.dynamic().setTranslation(x, y, z);
    if (facingAngleY !== undefined) {
      desc.setRotation({
        x: 0,
        y: Math.sin(facingAngleY / 2),
        z: 0,
        w: Math.cos(facingAngleY / 2),
      });
    }
    const body = this.world.createRigidBody(desc);

    const armVol = 8 * ahe.x * ahe.y * ahe.z;
    const collider = RAPIER.ColliderDesc.cuboid(ahe.x, ahe.y, ahe.z)
      .setDensity(armMass / armVol)
      .setFriction(0.6)
      .setRestitution(0.05);
    this.world.createCollider(collider, body);

    return body;
  }
}

// ══════════════════════════════════════════════
// Action Application
// ══════════════════════════════════════════════

/**
 * Apply arm motor targets to a robot. Call BEFORE world.step()
 * so joints resolve during physics.
 */
export function applyArmAction(robot: Robot, action: AgentAction): void {
  const leftTarget = mapNormalizedToAngle(action.leftArmTarget);
  const rightTarget = mapNormalizedToAngle(action.rightArmTarget);

  (robot.leftJoint as RAPIER.RevoluteImpulseJoint).configureMotorPosition(
    leftTarget,
    robot.config.armMotorStiffness,
    robot.config.armMotorDamping,
  );
  (robot.rightJoint as RAPIER.RevoluteImpulseJoint).configureMotorPosition(
    rightTarget,
    robot.config.armMotorStiffness,
    robot.config.armMotorDamping,
  );
}

/**
 * Apply drive + turn via direct velocity control. Call AFTER world.step()
 * so we blend with collision/knockback results instead of getting overridden by damping.
 */
export function applyMovementAction(
  robot: Robot,
  action: AgentAction,
): void {
  const driveForce = action.driveForce ?? 0;
  if (Math.abs(driveForce) > 0.01) {
    applyAgentDrive(robot, driveForce);
  }

  const turnRate = action.turnRate ?? 0;
  if (Math.abs(turnRate) > 0.01) {
    applyAgentTurn(robot, turnRate);
  }
}

/** Map [-1, 1] normalized value to [ARM_ANGLE_MIN, ARM_ANGLE_MAX] radians */
function mapNormalizedToAngle(normalized: number): number {
  const clamped = Math.max(-1, Math.min(1, normalized));
  return ((clamped + 1) / 2) * (ARM_ANGLE_MAX - ARM_ANGLE_MIN) + ARM_ANGLE_MIN;
}

/** Extract facing direction from chassis quaternion. Returns [fw_x, fw_z] on XZ plane. */
export function getFacingDirection(
  chassis: RAPIER.RigidBody,
): [number, number] {
  const rot = chassis.rotation();
  const fw_x = 2 * (rot.x * rot.z + rot.w * rot.y);
  const fw_z = 1 - 2 * (rot.x * rot.x + rot.y * rot.y);
  const len = Math.hypot(fw_x, fw_z);
  if (len < 0.001) return [0, 1];
  return [fw_x / len, fw_z / len];
}

function applyAgentDrive(robot: Robot, normalizedForce: number): void {
  const [fw_x, fw_z] = getFacingDirection(robot.chassis);
  const vel = robot.chassis.linvel();

  const fwdSpeed = vel.x * fw_x + vel.z * fw_z;
  const latX = vel.x - fwdSpeed * fw_x;
  const latZ = vel.z - fwdSpeed * fw_z;

  const targetFwd = normalizedForce * robot.config.maxSpeed;

  const latDamp = 0.92;
  const newVx = targetFwd * fw_x + latX * latDamp;
  const newVz = targetFwd * fw_z + latZ * latDamp;

  robot.chassis.setLinvel(new RAPIER.Vector3(newVx, vel.y, newVz), true);
}

function applyAgentTurn(robot: Robot, normalizedTurn: number): void {
  const targetAngVel = normalizedTurn * robot.config.maxAngularSpeed;
  const angvel = robot.chassis.angvel();
  robot.chassis.setAngvel(
    new RAPIER.Vector3(angvel.x, targetAngVel, angvel.z),
    true,
  );
}
