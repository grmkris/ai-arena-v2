export { initPhysics } from "./init.js";
export { Arena } from "./arena.js";
export { RobotFactory, applyArmAction, applyMovementAction, getFacingDirection } from "./robot-factory.js";
export type { Robot } from "./robot-factory.js";
export { Simulation } from "./simulation.js";
export type { ActionProvider, Projectile, ProjectileSnapshot } from "./simulation.js";
export { GameLoop } from "./game-loop.js";
export type { GameLoopCallbacks } from "./game-loop.js";
export {
  extractBodyState,
  extractArmState,
  extractRobotState,
  extractWorldState,
} from "./state-extractor.js";
