import { z } from "zod";

// ── Primitives ──

export const Vec3Schema = z.object({
  x: z.number(),
  y: z.number(),
  z: z.number(),
});

export const QuatSchema = z.object({
  x: z.number(),
  y: z.number(),
  z: z.number(),
  w: z.number(),
});

export const AgentIdSchema = z.union([z.literal(0), z.literal(1)]);

// ── Robot Build ──

export const ChassisTypeSchema = z.enum(["light", "medium", "heavy"]);
export const ArmsTypeSchema = z.enum(["short", "standard", "long"]);
export const WeaponTypeSchema = z.enum(["rapid", "standard", "heavy"]);

export const RobotBuildSchema = z.object({
  chassis: ChassisTypeSchema.optional().default("medium"),
  arms: ArmsTypeSchema.optional().default("standard"),
  weapon: WeaponTypeSchema.optional().default("standard"),
});

// ── Agent Action ──

export const AgentActionSchema = z.object({
  leftArmTarget: z.number().min(-1).max(1),
  rightArmTarget: z.number().min(-1).max(1),
  driveForce: z.number().min(-1).max(1).optional().default(0),
  turnRate: z.number().min(-1).max(1).optional().default(0),
  shoot: z.boolean().optional().default(false),
  thought: z.string().max(200).optional(),
  privateThought: z.string().max(200).optional(),
});

// ── Tactical Context ──

export const TacticalContextSchema = z.object({
  distanceToOpponent: z.number(),
  myDistFromCenter: z.number(),
  opponentDistFromCenter: z.number(),
  closingSpeed: z.number(),
  mySpeed: z.number(),
  opponentSpeed: z.number(),
  timeRemainingS: z.number(),
  round: z.number().int(),
  myFacingAngle: z.number(),
  opponentFacingAngle: z.number(),
  angleToOpponent: z.number(),
  myCooldownS: z.number(),
  opponentCooldownS: z.number(),
  incomingProjectiles: z.number().int(),
  myBuild: RobotBuildSchema.optional(),
  opponentBuild: RobotBuildSchema.optional(),
});

// ── Body / Arm / Robot State ──

export const BodyStateSchema = z.object({
  position: Vec3Schema,
  rotation: QuatSchema,
  linvel: Vec3Schema,
  angvel: Vec3Schema,
});

export const ArmStateSchema = z.object({
  body: BodyStateSchema,
  currentAngle: z.number(),
  targetAngle: z.number(),
});

export const RobotStateSchema = z.object({
  id: AgentIdSchema,
  build: RobotBuildSchema.optional(),
  chassis: BodyStateSchema,
  leftArm: ArmStateSchema,
  rightArm: ArmStateSchema,
  isAlive: z.boolean(),
});

export const MatchPhaseSchema = z.enum([
  "waiting",
  "countdown",
  "active",
  "finished",
]);

// ── HTTP API Request Schemas ──

export const JoinRequestSchema = z.object({
  name: z.string().min(1).max(32),
  build: RobotBuildSchema.optional(),
  room: z
    .string()
    .min(1)
    .max(32)
    .regex(/^[a-zA-Z0-9_-]+$/)
    .optional(),
});
