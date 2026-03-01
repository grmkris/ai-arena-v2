import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useArenaStore } from "../lib/store";
import type { RobotBuild } from "../lib/types";

const CHASSIS_DIMS: Record<string, { x: number; y: number; z: number }> = {
  light:   { x: 0.4, y: 0.25, z: 0.4 },
  medium:  { x: 0.5, y: 0.3,  z: 0.5 },
  heavy:   { x: 0.6, y: 0.35, z: 0.6 },
};

const ARM_DIMS: Record<string, { x: number; y: number; z: number; fist: number }> = {
  short:    { x: 0.10, y: 0.10, z: 0.5, fist: 0.13 },
  standard: { x: 0.12, y: 0.12, z: 0.7, fist: 0.16 },
  long:     { x: 0.14, y: 0.14, z: 0.9, fist: 0.20 },
};

const CHASSIS_METALNESS: Record<string, number> = {
  light: 0.5,
  medium: 0.7,
  heavy: 0.85,
};

function RobotBody({
  groupRef,
  leftArmRef,
  rightArmRef,
  color,
  emissiveColor,
  build,
}: {
  groupRef: React.RefObject<THREE.Group | null>;
  leftArmRef: React.RefObject<THREE.Group | null>;
  rightArmRef: React.RefObject<THREE.Group | null>;
  color: string;
  emissiveColor: string;
  build?: RobotBuild;
}) {
  const chassis = CHASSIS_DIMS[build?.chassis ?? "medium"]!;
  const arm = ARM_DIMS[build?.arms ?? "standard"]!;
  const metalness = CHASSIS_METALNESS[build?.chassis ?? "medium"]!;
  const weaponType = build?.weapon ?? "standard";
  const barrelRadius = weaponType === "heavy" ? 0.08 : weaponType === "rapid" ? 0.04 : 0.06;
  const barrelLength = weaponType === "heavy" ? 0.25 : weaponType === "rapid" ? 0.15 : 0.2;

  return (
    <group ref={groupRef}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[chassis.x * 2, chassis.y * 2, chassis.z * 2]} />
        <meshStandardMaterial color={color} emissive={emissiveColor} emissiveIntensity={0.4} metalness={metalness} roughness={0.2} />
      </mesh>

      {build?.chassis === "heavy" && (
        <>
          <mesh position={[chassis.x + 0.05, chassis.y * 0.5, 0]} castShadow>
            <boxGeometry args={[0.1, chassis.y * 1.2, chassis.z * 1.5]} />
            <meshStandardMaterial color={color} emissive={emissiveColor} emissiveIntensity={0.2} metalness={0.9} roughness={0.1} />
          </mesh>
          <mesh position={[-(chassis.x + 0.05), chassis.y * 0.5, 0]} castShadow>
            <boxGeometry args={[0.1, chassis.y * 1.2, chassis.z * 1.5]} />
            <meshStandardMaterial color={color} emissive={emissiveColor} emissiveIntensity={0.2} metalness={0.9} roughness={0.1} />
          </mesh>
        </>
      )}

      <mesh position={[chassis.x * 0.36, chassis.y * 0.5, chassis.z - 0.02]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={1.0} />
      </mesh>
      <mesh position={[-(chassis.x * 0.36), chassis.y * 0.5, chassis.z - 0.02]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={1.0} />
      </mesh>

      <mesh position={[0, chassis.y + barrelRadius + 0.02, chassis.z * 0.3]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[barrelRadius, barrelRadius, barrelLength, 8]} />
        <meshStandardMaterial
          color="#333333"
          emissive={weaponType === "heavy" ? "#ff4400" : weaponType === "rapid" ? "#44ff88" : "#4488ff"}
          emissiveIntensity={0.5}
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>

      <group ref={leftArmRef} position={[-(chassis.x + arm.x), 0, 0]}>
        <mesh castShadow position={[0, 0, arm.z / 2]}>
          <boxGeometry args={[arm.x * 2, arm.y * 2, arm.z * 2]} />
          <meshStandardMaterial color={color} emissive={emissiveColor} emissiveIntensity={0.2} metalness={0.8} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0, arm.z + 0.1]}>
          <sphereGeometry args={[arm.fist, 8, 8]} />
          <meshStandardMaterial color={emissiveColor} emissive={emissiveColor} emissiveIntensity={0.8} />
        </mesh>
      </group>

      <group ref={rightArmRef} position={[chassis.x + arm.x, 0, 0]}>
        <mesh castShadow position={[0, 0, arm.z / 2]}>
          <boxGeometry args={[arm.x * 2, arm.y * 2, arm.z * 2]} />
          <meshStandardMaterial color={color} emissive={emissiveColor} emissiveIntensity={0.2} metalness={0.8} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0, arm.z + 0.1]}>
          <sphereGeometry args={[arm.fist, 8, 8]} />
          <meshStandardMaterial color={emissiveColor} emissive={emissiveColor} emissiveIntensity={0.8} />
        </mesh>
      </group>
    </group>
  );
}

// ── Live RobotMesh (reads from store in useFrame — zero React re-renders) ──

interface LiveRobotMeshProps {
  agentIndex: 0 | 1;
  color: string;
  emissiveColor: string;
}

export function RobotMesh({ agentIndex, color, emissiveColor }: LiveRobotMeshProps) {
  const groupRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const targetQuat = useRef(new THREE.Quaternion());
  const targetPos = useRef(new THREE.Vector3());

  const [build] = useState<RobotBuild | undefined>(() => {
    const s = useArenaStore.getState();
    return s.robots?.[agentIndex]?.build ?? (agentIndex === 0 ? s.builds?.A : s.builds?.B);
  });

  useFrame((_frameState, delta) => {
    if (!groupRef.current) return;
    const robots = useArenaStore.getState().robots;
    if (!robots) return;

    const robot = robots[agentIndex];
    targetPos.current.set(robot.position[0], robot.position[1], robot.position[2]);
    groupRef.current.position.lerp(targetPos.current, Math.min(1, delta * 25));

    targetQuat.current.set(robot.rotation[0], robot.rotation[1], robot.rotation[2], robot.rotation[3]);
    groupRef.current.quaternion.slerp(targetQuat.current, Math.min(1, delta * 25));

    if (leftArmRef.current) {
      leftArmRef.current.rotation.y = THREE.MathUtils.lerp(leftArmRef.current.rotation.y, robot.armAngles[0], Math.min(1, delta * 25));
    }
    if (rightArmRef.current) {
      rightArmRef.current.rotation.y = THREE.MathUtils.lerp(rightArmRef.current.rotation.y, robot.armAngles[1], Math.min(1, delta * 25));
    }
  });

  return <RobotBody groupRef={groupRef} leftArmRef={leftArmRef} rightArmRef={rightArmRef} color={color} emissiveColor={emissiveColor} build={build} />;
}

// ── Replay RobotMesh (props-driven, for replay playback) ──

interface ReplayRobotMeshProps {
  position: [number, number, number];
  rotation: [number, number, number, number];
  armAngles: [number, number];
  color: string;
  emissiveColor: string;
  build?: RobotBuild;
}

export function ReplayRobotMesh({ position, rotation, armAngles, color, emissiveColor, build }: ReplayRobotMeshProps) {
  const groupRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const targetQuat = useRef(new THREE.Quaternion());
  const targetPos = useRef(new THREE.Vector3());

  useFrame((_frameState, delta) => {
    if (!groupRef.current) return;

    targetPos.current.set(position[0], position[1], position[2]);
    groupRef.current.position.lerp(targetPos.current, Math.min(1, delta * 25));

    targetQuat.current.set(rotation[0], rotation[1], rotation[2], rotation[3]);
    groupRef.current.quaternion.slerp(targetQuat.current, Math.min(1, delta * 25));

    if (leftArmRef.current) {
      leftArmRef.current.rotation.y = THREE.MathUtils.lerp(leftArmRef.current.rotation.y, armAngles[0], Math.min(1, delta * 25));
    }
    if (rightArmRef.current) {
      rightArmRef.current.rotation.y = THREE.MathUtils.lerp(rightArmRef.current.rotation.y, armAngles[1], Math.min(1, delta * 25));
    }
  });

  return <RobotBody groupRef={groupRef} leftArmRef={leftArmRef} rightArmRef={rightArmRef} color={color} emissiveColor={emissiveColor} build={build} />;
}
