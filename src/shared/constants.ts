// ── Physics ──
export const TICK_RATE = 60;
export const TICK_DURATION_S = 1 / TICK_RATE;
export const TICK_DURATION_MS = 1000 / TICK_RATE;

// ── Arena ──
export const ARENA_RADIUS = 10; // Bigger arena for maneuvering (was 5)
export const ARENA_FLOOR_Y = 0;

// ── Robot Chassis ──
export const CHASSIS_HALF_EXTENTS = { x: 0.5, y: 0.3, z: 0.5 } as const;
export const CHASSIS_MASS = 12; // kg — heavier = harder to knock off (need multiple hits)

// ── Robot Arms ──
export const ARM_HALF_EXTENTS = { x: 0.12, y: 0.12, z: 0.7 } as const;
export const ARM_MASS = 1.5; // kg
export const ARM_ANGLE_MIN = -Math.PI / 2.5; // -72 degrees
export const ARM_ANGLE_MAX = Math.PI / 2.5; // +72 degrees
export const ARM_MOTOR_STIFFNESS = 40; // Nm/rad — reduced to prevent collision catapult
export const ARM_MOTOR_DAMPING = 8; // Nm*s/rad — higher damping for stability

// ── Chassis Drive (agent-controlled, no more auto-approach) ──
export const CHASSIS_DRIVE_FORCE = 40; // Newtons — agent-controlled thrust (40/12kg ≈ 3.3 m/s²)
export const CHASSIS_MAX_SPEED = 4; // m/s — moderate top speed
export const CHASSIS_TURN_TORQUE = 15; // Nm — yaw turning power
export const CHASSIS_MAX_ANGULAR_SPEED = 3; // rad/s — cap on yaw rotation

// ── Projectile ──
export const PROJECTILE_SPEED = 10; // m/s
export const PROJECTILE_COOLDOWN_MS = 3000; // 3 seconds between shots
export const PROJECTILE_COOLDOWN_TICKS = Math.ceil(PROJECTILE_COOLDOWN_MS / TICK_DURATION_MS);
export const PROJECTILE_KNOCKBACK_IMPULSE = 30; // N*s — shove (30/12kg = 2.5 m/s per hit)
export const PROJECTILE_LIFETIME_MS = 2000; // disappears after 2 seconds
export const PROJECTILE_LIFETIME_TICKS = Math.ceil(PROJECTILE_LIFETIME_MS / TICK_DURATION_MS);
export const PROJECTILE_RADIUS = 0.15; // collision sphere radius

// ── Match Rules ──
export const MATCH_DURATION_S = 60; // Longer matches for bigger arena (was 45)
export const MATCH_DURATION_TICKS = MATCH_DURATION_S * TICK_RATE;
export const RING_OUT_Y_THRESHOLD = -2;
export const RING_OUT_DISTANCE_MARGIN = 1; // beyond arena radius

// ── Turn-based ──
export const TICKS_PER_TURN = 12; // 200ms game time per turn (300 turns per 60s match)
export const TURN_TIMEOUT_MS = 30_000; // 30s per-turn timeout

// ── Protocol ──
export const PROTOCOL_VERSION = 5;
export const MAX_AGENTS = 2;
export const VIEWER_BROADCAST_RATE = 30; // Hz
export const VIEWER_BROADCAST_INTERVAL = Math.floor(TICK_RATE / VIEWER_BROADCAST_RATE);

// ── Countdown ──
export const COUNTDOWN_DURATION_S = 5;
export const COUNTDOWN_DURATION_TICKS = COUNTDOWN_DURATION_S * TICK_RATE;

// ── Queue ──
export const MAX_QUEUE_SIZE = 10;
export const QUEUE_INACTIVITY_TIMEOUT_MS = 60_000; // 60 seconds

// ── Agent HTTP API ──
export const AGENT_INACTIVITY_TIMEOUT_MS = 10_000; // 10 seconds
