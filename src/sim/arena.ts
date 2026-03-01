import RAPIER from "@dimforge/rapier3d-compat";
import { ARENA_RADIUS, ARENA_FLOOR_Y } from "../shared/constants.js";

/**
 * Creates the arena: a circular floor platform.
 * No walls — ring-out is detected by position, not collision.
 */
export class Arena {
  readonly floorBody: RAPIER.RigidBody;

  constructor(private world: RAPIER.World) {
    this.floorBody = this.createFloor();
  }

  private createFloor(): RAPIER.RigidBody {
    const bodyDesc = RAPIER.RigidBodyDesc.fixed().setTranslation(
      0,
      ARENA_FLOOR_Y - 0.1,
      0,
    );
    const body = this.world.createRigidBody(bodyDesc);

    const colliderDesc = RAPIER.ColliderDesc.cylinder(0.1, ARENA_RADIUS)
      .setFriction(0.8)
      .setRestitution(0.2);
    this.world.createCollider(colliderDesc, body);

    return body;
  }
}
