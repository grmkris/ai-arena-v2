// ══════════════════════════════════════════════
// Robot Build System — Modular Part Selection
// ══════════════════════════════════════════════
//
// Players build robots by picking one part from each of 3 categories:
//   Chassis (Light / Medium / Heavy)  × Arms (Short / Standard / Long)  × Weapon (Rapid / Standard / Heavy)
// = 27 unique combinations
//
// Default build (Medium + Standard + Standard) matches the original robot stats exactly.

// ── Part Types ──

export type ChassisType = "light" | "medium" | "heavy";
export type ArmsType = "short" | "standard" | "long";
export type WeaponType = "rapid" | "standard" | "heavy";

export interface RobotBuild {
  chassis: ChassisType;
  arms: ArmsType;
  weapon: WeaponType;
}

export const DEFAULT_BUILD: RobotBuild = {
  chassis: "medium",
  arms: "standard",
  weapon: "standard",
};

// ── Per-robot config (computed from build) ──

export interface RobotConfig {
  build: RobotBuild;
  // Chassis
  chassisHalfExtents: { x: number; y: number; z: number };
  chassisMass: number;
  maxSpeed: number;
  maxAngularSpeed: number;
  knockbackMultiplier: number;
  stunTicks: number;
  // Arms
  armHalfExtents: { x: number; y: number; z: number };
  armMass: number;
  armMotorStiffness: number;
  armMotorDamping: number;
  // Weapon
  projectileCooldownMs: number;
  projectileSpeed: number;
  projectileKnockbackImpulse: number;
}

// ── Part Presets ──

interface ChassisPreset {
  chassisHalfExtents: { x: number; y: number; z: number };
  chassisMass: number;
  maxSpeed: number;
  maxAngularSpeed: number;
  knockbackMultiplier: number;
  stunTicks: number;
}

interface ArmsPreset {
  armHalfExtents: { x: number; y: number; z: number };
  armMass: number;
  armMotorStiffness: number;
  armMotorDamping: number;
}

interface WeaponPreset {
  projectileCooldownMs: number;
  projectileSpeed: number;
  projectileKnockbackImpulse: number;
}

export const CHASSIS_PRESETS: Record<ChassisType, ChassisPreset> = {
  light: {
    chassisHalfExtents: { x: 0.4, y: 0.25, z: 0.4 },
    chassisMass: 8,
    maxSpeed: 5.5,
    maxAngularSpeed: 4,
    knockbackMultiplier: 1.3,
    stunTicks: 20,
  },
  medium: {
    chassisHalfExtents: { x: 0.5, y: 0.3, z: 0.5 },
    chassisMass: 12,
    maxSpeed: 4,
    maxAngularSpeed: 3,
    knockbackMultiplier: 1.0,
    stunTicks: 15,
  },
  heavy: {
    chassisHalfExtents: { x: 0.6, y: 0.35, z: 0.6 },
    chassisMass: 20,
    maxSpeed: 2.8,
    maxAngularSpeed: 2.2,
    knockbackMultiplier: 0.7,
    stunTicks: 10,
  },
};

export const ARMS_PRESETS: Record<ArmsType, ArmsPreset> = {
  short: {
    armHalfExtents: { x: 0.12, y: 0.12, z: 0.5 },
    armMass: 1.0,
    armMotorStiffness: 50,
    armMotorDamping: 5,
  },
  standard: {
    armHalfExtents: { x: 0.12, y: 0.12, z: 0.7 },
    armMass: 1.5,
    armMotorStiffness: 40,
    armMotorDamping: 8,
  },
  long: {
    armHalfExtents: { x: 0.12, y: 0.12, z: 0.9 },
    armMass: 2.0,
    armMotorStiffness: 30,
    armMotorDamping: 12,
  },
};

export const WEAPON_PRESETS: Record<WeaponType, WeaponPreset> = {
  rapid: {
    projectileCooldownMs: 1800,
    projectileSpeed: 8,
    projectileKnockbackImpulse: 15,
  },
  standard: {
    projectileCooldownMs: 3000,
    projectileSpeed: 10,
    projectileKnockbackImpulse: 30,
  },
  heavy: {
    projectileCooldownMs: 4500,
    projectileSpeed: 14,
    projectileKnockbackImpulse: 45,
  },
};

/** Combine 3 part selections into a full RobotConfig. */
export function buildRobotConfig(build: Partial<RobotBuild> = {}): RobotConfig {
  const resolved: RobotBuild = {
    chassis: build.chassis ?? DEFAULT_BUILD.chassis,
    arms: build.arms ?? DEFAULT_BUILD.arms,
    weapon: build.weapon ?? DEFAULT_BUILD.weapon,
  };

  return {
    build: resolved,
    ...CHASSIS_PRESETS[resolved.chassis],
    ...ARMS_PRESETS[resolved.arms],
    ...WEAPON_PRESETS[resolved.weapon],
  };
}
