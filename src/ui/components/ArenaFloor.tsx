import { Grid } from "@react-three/drei";

const ARENA_RADIUS = 10;

export function ArenaFloor() {
  return (
    <group>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
        <cylinderGeometry args={[ARENA_RADIUS, ARENA_RADIUS, 0.2, 64]} />
        <meshStandardMaterial color="#1a1a2e" metalness={0.4} roughness={0.5} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[ARENA_RADIUS - 0.2, ARENA_RADIUS, 64]} />
        <meshStandardMaterial color="#ff2222" emissive="#ff2222" emissiveIntensity={1.2} transparent opacity={0.8} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[ARENA_RADIUS * 0.7 - 0.05, ARENA_RADIUS * 0.7 + 0.05, 64]} />
        <meshStandardMaterial color="#ff8800" emissive="#ff8800" emissiveIntensity={0.4} transparent opacity={0.4} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[0.4, 0.5, 32]} />
        <meshStandardMaterial color="#6666cc" emissive="#6666cc" emissiveIntensity={0.5} transparent opacity={0.6} />
      </mesh>

      <Grid
        position={[0, 0.02, 0]}
        args={[25, 25]}
        cellSize={2}
        cellThickness={0.5}
        cellColor="#333355"
        sectionSize={ARENA_RADIUS}
        sectionThickness={1}
        sectionColor="#444477"
        fadeDistance={22}
        fadeStrength={1}
        infiniteGrid={false}
      />
    </group>
  );
}
