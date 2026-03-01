export function Lights() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[5, 12, 8]}
        intensity={1.5}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={30}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
      />
      <pointLight position={[0, 8, 0]} intensity={0.8} color="#4466ff" />
      <pointLight position={[-4, 5, -4]} intensity={0.3} color="#2266ff" />
      <pointLight position={[4, 5, 4]} intensity={0.3} color="#ff4422" />
    </>
  );
}
