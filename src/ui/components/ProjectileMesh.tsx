import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface ProjectileMeshProps {
  position: [number, number, number];
  ownerId: 0 | 1;
}

export function ProjectileMesh({ position, ownerId }: ProjectileMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  const color = ownerId === 0 ? "#44aaff" : "#ff6622";
  const emissiveColor = ownerId === 0 ? "#2288ff" : "#ff4400";

  useFrame(({ clock }) => {
    if (meshRef.current) {
      const scale = 1 + Math.sin(clock.getElapsedTime() * 8) * 0.15;
      meshRef.current.scale.setScalar(scale);
    }
  });

  return (
    <group position={position}>
      <mesh ref={meshRef} castShadow>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial color={color} emissive={emissiveColor} emissiveIntensity={3} toneMapped={false} />
      </mesh>
      <pointLight color={color} intensity={2} distance={3} decay={2} />
    </group>
  );
}
