'use client';

interface OfficeLightingProps {
  workstationPositions: [number, number, number][];
}

export default function OfficeLighting({ workstationPositions }: OfficeLightingProps) {
  return (
    <>
      <ambientLight intensity={0.8} color="#f5f0e8" />
      <directionalLight
        position={[8, 14, 6]}
        intensity={1.1}
        color="#fff5e6"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      <directionalLight position={[-5, 8, -4]} intensity={0.35} color="#b0c4de" />
      <hemisphereLight args={['#e8e0d4', '#8090a0', 0.4]} />
      {/* Warm point light in break room */}
      <pointLight position={[0, 1.2, 3.5]} intensity={0.6} color="#fff0d0" distance={5} decay={2} />
      {/* Overhead desk lamps */}
      {workstationPositions.map(([x, , z], i) => (
        <pointLight
          key={`desk-light-${i}`}
          position={[x, 1.3, z]}
          intensity={0.15}
          color="#fff5e0"
          distance={3}
          decay={2}
        />
      ))}
    </>
  );
}
