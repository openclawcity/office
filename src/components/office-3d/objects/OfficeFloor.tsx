'use client';

import { PARTITION_Z } from '../core/constants';

const PLANK_COUNT = 14;
const PLANK_COLOR = '#a07850';
const PLANK_WIDTH = 0.008;

interface OfficeFloorProps {
  roomWidth: number;
  roomDepth: number;
  floorColor?: string;
}

export default function OfficeFloor({ roomWidth, roomDepth, floorColor = '#c8a97e' }: OfficeFloorProps) {
  const officeDepthStart = -roomDepth / 2;
  const officeDepthEnd = PARTITION_Z;
  const officeDepthSpan = officeDepthEnd - officeDepthStart;

  const plankLines: number[] = [];
  for (let i = 1; i <= PLANK_COUNT; i++) {
    plankLines.push(officeDepthStart + (i / (PLANK_COUNT + 1)) * officeDepthSpan);
  }

  const restDepth = roomDepth / 2 - PARTITION_Z;
  const restCenterZ = PARTITION_Z + restDepth / 2;

  return (
    <group>
      {/* Dark ground base */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.015, 0]} receiveShadow>
        <planeGeometry args={[roomWidth + 4, roomDepth + 4]} />
        <meshStandardMaterial color="#1a1e24" roughness={0.98} />
      </mesh>

      {/* Main office floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, (officeDepthStart + officeDepthEnd) / 2]} receiveShadow>
        <planeGeometry args={[roomWidth, officeDepthSpan]} />
        <meshLambertMaterial color={floorColor} />
      </mesh>

      {/* Wood plank lines */}
      {plankLines.map((z, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, z]}>
          <planeGeometry args={[roomWidth - 0.3, PLANK_WIDTH]} />
          <meshBasicMaterial color={PLANK_COLOR} transparent opacity={0.25} />
        </mesh>
      ))}

      {/* Rest area floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, restCenterZ]} receiveShadow>
        <planeGeometry args={[roomWidth, restDepth]} />
        <meshLambertMaterial color="#b8a080" />
      </mesh>
    </group>
  );
}
