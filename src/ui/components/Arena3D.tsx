import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { RobotMesh } from "./RobotMesh";
import { ArenaFloor } from "./ArenaFloor";
import { Lights } from "./Lights";
import { CameraRig } from "./CameraRig";
import { useArenaStore } from "../lib/store";

const MAX_PROJECTILES = 10;

function ProjectilesRenderer() {
  const groupRefs = useRef<(THREE.Group | null)[]>([]);
  const meshRefs = useRef<(THREE.Mesh | null)[]>([]);
  const matRefs = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const lightRefs = useRef<(THREE.PointLight | null)[]>([]);

  useFrame(({ clock }) => {
    const projectiles = useArenaStore.getState().projectiles;

    for (let i = 0; i < MAX_PROJECTILES; i++) {
      const group = groupRefs.current[i];
      if (!group) continue;

      if (i < projectiles.length) {
        const proj = projectiles[i]!;
        group.visible = true;
        group.position.set(proj.position[0], proj.position[1], proj.position[2]);

        const mat = matRefs.current[i];
        const light = lightRefs.current[i];
        if (mat) {
          if (proj.ownerId === 0) {
            mat.color.set("#44aaff");
            mat.emissive.set("#2288ff");
          } else {
            mat.color.set("#ff6622");
            mat.emissive.set("#ff4400");
          }
        }
        if (light) {
          light.color.set(proj.ownerId === 0 ? "#44aaff" : "#ff6622");
        }

        const mesh = meshRefs.current[i];
        if (mesh) {
          const scale = 1 + Math.sin(clock.getElapsedTime() * 8) * 0.15;
          mesh.scale.setScalar(scale);
        }
      } else {
        group.visible = false;
      }
    }
  });

  return (
    <>
      {Array.from({ length: MAX_PROJECTILES }, (_, i) => (
        <group
          key={i}
          ref={(el) => { groupRefs.current[i] = el; }}
          visible={false}
        >
          <mesh
            ref={(el) => { meshRefs.current[i] = el; }}
            castShadow
          >
            <sphereGeometry args={[0.15, 10, 10]} />
            <meshStandardMaterial
              ref={(el) => { matRefs.current[i] = el; }}
              color="#44aaff"
              emissive="#2288ff"
              emissiveIntensity={3}
              toneMapped={false}
            />
          </mesh>
          <pointLight
            ref={(el) => { lightRefs.current[i] = el; }}
            color="#44aaff"
            intensity={1.5}
            distance={2}
            decay={2}
          />
        </group>
      ))}
    </>
  );
}

function SceneContent() {
  return (
    <>
      <Lights />
      <ArenaFloor />
      <CameraRig />
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        maxPolarAngle={Math.PI / 2.1}
        minDistance={3}
        maxDistance={35}
      />
      <RobotMesh agentIndex={0} color="#2266ff" emissiveColor="#4488ff" />
      <RobotMesh agentIndex={1} color="#ff4422" emissiveColor="#ff6644" />
      <ProjectilesRenderer />
    </>
  );
}

export function Arena3D() {
  return (
    <div className="w-full h-full">
      <Canvas
        shadows
        dpr={[1, 1.5]}
        camera={{ position: [0, 14, 18], fov: 50 }}
        style={{ background: "#0a0a1a" }}
        gl={{ antialias: true, powerPreference: "default" }}
      >
        <SceneContent />
      </Canvas>
    </div>
  );
}
