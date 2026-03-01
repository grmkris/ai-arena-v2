import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useArenaStore } from "../lib/store";

export function CameraRig() {
  const { controls } = useThree();
  const targetPos = useRef(new THREE.Vector3(0, 0, 0));

  useFrame(() => {
    const robots = useArenaStore.getState().robots;
    if (!robots || !controls) return;

    const [r0, r1] = robots;
    const midX = (r0.position[0] + r1.position[0]) / 2;
    const midZ = (r0.position[2] + r1.position[2]) / 2;

    targetPos.current.lerp(new THREE.Vector3(midX, 0, midZ), 0.05);

    const orbitControls = controls as unknown as { target: THREE.Vector3 };
    if (orbitControls.target) {
      orbitControls.target.copy(targetPos.current);
    }
  });

  return null;
}
