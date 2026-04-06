'use client';

import { PARTITION_Z } from '../core/constants';

const WALL_THICKNESS = 0.12;
const DOOR_WIDTH = 2;
const BASEBOARD_HEIGHT = 0.06;
const BASEBOARD_INSET = 0.04;

const wallMat = {
  color: '#8d6e63',
  emissive: '#4e342e',
  emissiveIntensity: 0.3,
  roughness: 0.9,
} as const;

const baseboardColor = '#0c0c10';

function Baseboard({ width, position, rotation }: {
  width: number;
  position: [number, number, number];
  rotation?: [number, number, number];
}) {
  return (
    <mesh position={position} rotation={rotation || [0, 0, 0]}>
      <boxGeometry args={[width, BASEBOARD_HEIGHT, WALL_THICKNESS / 2]} />
      <meshStandardMaterial color={baseboardColor} roughness={0.95} />
    </mesh>
  );
}

interface OfficeWallsProps {
  roomWidth: number;
  roomDepth: number;
  roomHeight: number;
  wallColor?: string;
}

export default function OfficeWalls({ roomWidth, roomDepth, roomHeight, wallColor }: OfficeWallsProps) {
  const halfW = roomWidth / 2;
  const halfD = roomDepth / 2;
  const halfH = roomHeight / 2;

  const mat = wallColor
    ? { ...wallMat, color: wallColor }
    : wallMat;

  const frontSectionW = (roomWidth - DOOR_WIDTH) / 2;
  const partSectionW = (roomWidth - DOOR_WIDTH) / 2;

  return (
    <group>
      {/* Back wall */}
      <mesh position={[0, halfH, -halfD]}>
        <boxGeometry args={[roomWidth, roomHeight, WALL_THICKNESS]} />
        <meshStandardMaterial {...mat} />
      </mesh>
      <Baseboard width={roomWidth} position={[0, BASEBOARD_HEIGHT / 2, -halfD + WALL_THICKNESS / 2 + BASEBOARD_INSET]} />

      {/* Left wall */}
      <mesh position={[-halfW, halfH, 0]}>
        <boxGeometry args={[WALL_THICKNESS, roomHeight, roomDepth]} />
        <meshStandardMaterial {...mat} />
      </mesh>
      <Baseboard width={roomDepth} position={[-halfW + WALL_THICKNESS / 2 + BASEBOARD_INSET, BASEBOARD_HEIGHT / 2, 0]} rotation={[0, Math.PI / 2, 0]} />

      {/* Right wall */}
      <mesh position={[halfW, halfH, 0]}>
        <boxGeometry args={[WALL_THICKNESS, roomHeight, roomDepth]} />
        <meshStandardMaterial {...mat} />
      </mesh>
      <Baseboard width={roomDepth} position={[halfW - WALL_THICKNESS / 2 - BASEBOARD_INSET, BASEBOARD_HEIGHT / 2, 0]} rotation={[0, Math.PI / 2, 0]} />

      {/* Front wall (with door) */}
      <mesh position={[-(DOOR_WIDTH / 2 + frontSectionW / 2), halfH, halfD]}>
        <boxGeometry args={[frontSectionW, roomHeight, WALL_THICKNESS]} />
        <meshStandardMaterial {...mat} />
      </mesh>
      <Baseboard width={frontSectionW} position={[-(DOOR_WIDTH / 2 + frontSectionW / 2), BASEBOARD_HEIGHT / 2, halfD - WALL_THICKNESS / 2 - BASEBOARD_INSET]} />
      <mesh position={[(DOOR_WIDTH / 2 + frontSectionW / 2), halfH, halfD]}>
        <boxGeometry args={[frontSectionW, roomHeight, WALL_THICKNESS]} />
        <meshStandardMaterial {...mat} />
      </mesh>
      <Baseboard width={frontSectionW} position={[(DOOR_WIDTH / 2 + frontSectionW / 2), BASEBOARD_HEIGHT / 2, halfD - WALL_THICKNESS / 2 - BASEBOARD_INSET]} />

      {/* Interior partition */}
      <mesh position={[-(DOOR_WIDTH / 2 + partSectionW / 2), halfH, PARTITION_Z]}>
        <boxGeometry args={[partSectionW, roomHeight, WALL_THICKNESS]} />
        <meshStandardMaterial {...mat} />
      </mesh>
      <Baseboard width={partSectionW} position={[-(DOOR_WIDTH / 2 + partSectionW / 2), BASEBOARD_HEIGHT / 2, PARTITION_Z - WALL_THICKNESS / 2 - BASEBOARD_INSET]} />
      <mesh position={[(DOOR_WIDTH / 2 + partSectionW / 2), halfH, PARTITION_Z]}>
        <boxGeometry args={[partSectionW, roomHeight, WALL_THICKNESS]} />
        <meshStandardMaterial {...mat} />
      </mesh>
      <Baseboard width={partSectionW} position={[(DOOR_WIDTH / 2 + partSectionW / 2), BASEBOARD_HEIGHT / 2, PARTITION_Z - WALL_THICKNESS / 2 - BASEBOARD_INSET]} />
    </group>
  );
}
