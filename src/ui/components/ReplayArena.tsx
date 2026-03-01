import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { ReplayRobotMesh } from "./RobotMesh";
import { ArenaFloor } from "./ArenaFloor";
import { Lights } from "./Lights";
import { ProjectileMesh } from "./ProjectileMesh";
import type { RobotBuild } from "../lib/types";

interface ViewerRobotFrame {
  position: [number, number, number];
  rotation: [number, number, number, number];
  armAngles: [number, number];
  build?: RobotBuild;
}

interface ViewerProjectileFrame {
  position: [number, number, number];
  ownerId: 0 | 1;
}

export interface ViewerFrame {
  tick: number;
  time: number;
  robots: [ViewerRobotFrame, ViewerRobotFrame];
  projectiles?: ViewerProjectileFrame[];
}

interface ReplayArenaProps {
  frame: ViewerFrame | null;
  agentBuilds?: { A: RobotBuild; B: RobotBuild };
}

function SceneContent({ frame, agentBuilds }: ReplayArenaProps) {
  return (
    <>
      <Lights />
      <ArenaFloor />
      <OrbitControls enablePan enableZoom maxPolarAngle={Math.PI / 2.1} minDistance={3} maxDistance={35} />
      {frame && (
        <>
          <ReplayRobotMesh
            position={frame.robots[0].position}
            rotation={frame.robots[0].rotation}
            armAngles={frame.robots[0].armAngles}
            color="#2266ff"
            emissiveColor="#4488ff"
            build={frame.robots[0].build ?? agentBuilds?.A}
          />
          <ReplayRobotMesh
            position={frame.robots[1].position}
            rotation={frame.robots[1].rotation}
            armAngles={frame.robots[1].armAngles}
            color="#ff4422"
            emissiveColor="#ff6644"
            build={frame.robots[1].build ?? agentBuilds?.B}
          />
          {frame.projectiles?.map((proj, i) => (
            <ProjectileMesh key={`proj-${i}`} position={proj.position} ownerId={proj.ownerId} />
          ))}
        </>
      )}
    </>
  );
}

export function ReplayArena({ frame, agentBuilds }: ReplayArenaProps) {
  return (
    <div className="w-full h-full">
      <Canvas shadows camera={{ position: [0, 14, 18], fov: 50 }} style={{ background: "#0a0a1a" }}>
        <SceneContent frame={frame} agentBuilds={agentBuilds} />
      </Canvas>
    </div>
  );
}
