import RAPIER from "@dimforge/rapier3d-compat";

let initialized = false;

/**
 * Initialize the Rapier3D WASM module.
 * MUST be called once before any Rapier API usage.
 * Safe to call multiple times (idempotent).
 */
export async function initPhysics(): Promise<typeof RAPIER> {
  if (!initialized) {
    await RAPIER.init();
    initialized = true;
  }
  return RAPIER;
}
