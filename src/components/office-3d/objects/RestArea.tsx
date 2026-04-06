'use client';

import { Billboard, Text } from '@react-three/drei';
import { PARTITION_Z } from '../core/constants';

const SOFA_FRAME = '#2a3a50';
const SOFA_BACK = '#243248';
const SOFA_CUSHION = '#3a5070';
const PILLOW_RED = '#c0392b';
const PILLOW_AMBER = '#f39c12';
const TABLE_WALNUT = '#6b4c30';
const TABLE_METAL = '#444444';
const MAGAZINE_RED = '#c0392b';
const COOLER_BODY = '#e8e8e4';
const COOLER_WATER = '#a0d0f0';
const COOLER_TAP = '#dddddd';
const COOLER_TRAY = '#aaaaaa';
const BTN_COLD = '#3498db';
const BTN_HOT = '#e74c3c';
const POT_COLOR = '#6b4c30';
const SOIL_COLOR = '#3a2a1a';
const FOLIAGE_COLORS = ['#2d6b3a', '#3a8a4a', '#4a9a5a', '#2d6b3a', '#3a8a4a', '#4a9a5a', '#2d6b3a'];
const FOLIAGE_POSITIONS: [number, number, number, number][] = [
  [0, 0.35, 0, 0.14], [0.08, 0.42, 0.05, 0.10], [-0.06, 0.40, -0.04, 0.12],
  [0.03, 0.48, -0.03, 0.09], [-0.04, 0.46, 0.06, 0.08], [0.06, 0.34, -0.06, 0.10], [-0.08, 0.38, 0.02, 0.09],
];
const CLOCK_FACE = '#f5f0e8';
const CLOCK_FRAME = '#2a2a2a';
const BOARD_WHITE = '#f8f8f0';
const BOARD_FRAME = '#888888';
const MARKER_COLORS = ['#e74c3c', '#3498db', '#2ecc71'];

interface RestAreaProps {
  roomWidth: number;
}

export default function RestArea({ roomWidth }: RestAreaProps) {
  const centerZ = 3.8;
  const wallZ = -(centerZ - PARTITION_Z);

  return (
    <group position={[0, 0, centerZ]}>
      {/* L-shaped sofa */}
      <group position={[-3.2, 0, 0.3]}>
        <mesh position={[0, 0.175, 0]} castShadow receiveShadow><boxGeometry args={[3.5, 0.35, 0.9]} /><meshStandardMaterial color={SOFA_FRAME} roughness={0.9} /></mesh>
        <mesh position={[0, 0.525, -0.42]}><boxGeometry args={[3.5, 0.35, 0.08]} /><meshStandardMaterial color={SOFA_BACK} roughness={0.9} /></mesh>
        <mesh position={[-1.71, 0.35, 0]}><boxGeometry args={[0.08, 0.25, 0.9]} /><meshStandardMaterial color={SOFA_BACK} roughness={0.9} /></mesh>
        {[-1.27, -0.42, 0.43, 1.28].map((cx, i) => (
          <mesh key={`lc-${i}`} position={[cx, 0.37, 0.0]} castShadow><boxGeometry args={[0.78, 0.05, 0.75]} /><meshStandardMaterial color={SOFA_CUSHION} roughness={0.95} /></mesh>
        ))}
        <mesh position={[1.3, 0.175, -0.95]} castShadow receiveShadow><boxGeometry args={[0.9, 0.35, 2.0]} /><meshStandardMaterial color={SOFA_FRAME} roughness={0.9} /></mesh>
        <mesh position={[1.72, 0.525, -0.95]}><boxGeometry args={[0.08, 0.35, 2.0]} /><meshStandardMaterial color={SOFA_BACK} roughness={0.9} /></mesh>
        <mesh position={[1.3, 0.35, -1.92]}><boxGeometry args={[0.9, 0.25, 0.08]} /><meshStandardMaterial color={SOFA_BACK} roughness={0.9} /></mesh>
        {[-0.5, -1.35].map((cz, i) => (
          <mesh key={`sc-${i}`} position={[1.3, 0.37, cz]} castShadow><boxGeometry args={[0.75, 0.05, 0.78]} /><meshStandardMaterial color={SOFA_CUSHION} roughness={0.95} /></mesh>
        ))}
        <mesh position={[-1.45, 0.45, 0.0]} scale={[1, 0.5, 1]}><sphereGeometry args={[0.14, 10, 8]} /><meshStandardMaterial color={PILLOW_RED} roughness={0.9} /></mesh>
        <mesh position={[1.3, 0.45, -1.65]} scale={[1, 0.5, 1]}><sphereGeometry args={[0.12, 10, 8]} /><meshStandardMaterial color={PILLOW_AMBER} roughness={0.9} /></mesh>
      </group>

      {/* Coffee table */}
      <group position={[-2.0, 0, 1.2]}>
        <mesh position={[0, 0.4, 0]} castShadow receiveShadow><cylinderGeometry args={[0.55, 0.55, 0.035, 28]} /><meshStandardMaterial color={TABLE_WALNUT} roughness={0.55} metalness={0.08} /></mesh>
        <mesh position={[0, 0.2, 0]}><cylinderGeometry args={[0.04, 0.04, 0.38, 10]} /><meshStandardMaterial color={TABLE_METAL} roughness={0.4} metalness={0.5} /></mesh>
        <mesh position={[0, 0.01, 0]}><cylinderGeometry args={[0.25, 0.25, 0.02, 18]} /><meshStandardMaterial color={TABLE_METAL} roughness={0.4} metalness={0.5} /></mesh>
        <mesh position={[0.12, 0.425, -0.08]} rotation={[0, 0.3, 0]}><boxGeometry args={[0.18, 0.005, 0.25]} /><meshStandardMaterial color={MAGAZINE_RED} roughness={0.8} /></mesh>
      </group>

      {/* Water cooler */}
      <group position={[roomWidth / 2 - 0.8, 0, wallZ + 0.3]}>
        <mesh position={[0, 0.45, 0]} castShadow><boxGeometry args={[0.25, 0.9, 0.22]} /><meshStandardMaterial color={COOLER_BODY} roughness={0.6} /></mesh>
        <mesh position={[0, 1.04, 0]}><cylinderGeometry args={[0.09, 0.09, 0.28, 14]} /><meshStandardMaterial color={COOLER_WATER} transparent opacity={0.3} roughness={0.15} /></mesh>
        <mesh position={[0, 0.45, 0.115]}><boxGeometry args={[0.15, 0.1, 0.01]} /><meshStandardMaterial color={COOLER_TAP} roughness={0.5} /></mesh>
        <mesh position={[-0.03, 0.47, 0.125]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.012, 0.012, 0.01, 8]} /><meshStandardMaterial color={BTN_COLD} roughness={0.5} /></mesh>
        <mesh position={[0.03, 0.47, 0.125]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.012, 0.012, 0.01, 8]} /><meshStandardMaterial color={BTN_HOT} roughness={0.5} /></mesh>
        <mesh position={[0, 0.1, 0.15]}><boxGeometry args={[0.12, 0.015, 0.08]} /><meshStandardMaterial color={COOLER_TRAY} roughness={0.5} metalness={0.3} /></mesh>
      </group>

      {/* Potted plant */}
      <group position={[-roomWidth / 2 + 0.6, 0, 0.5]}>
        <mesh position={[0, 0.125, 0]}><cylinderGeometry args={[0.15, 0.12, 0.25, 12]} /><meshStandardMaterial color={POT_COLOR} roughness={0.75} /></mesh>
        <mesh position={[0, 0.26, 0]}><cylinderGeometry args={[0.14, 0.14, 0.02, 12]} /><meshStandardMaterial color={SOIL_COLOR} roughness={1} /></mesh>
        {FOLIAGE_POSITIONS.map(([x, y, z, r], i) => (
          <mesh key={`leaf-${i}`} position={[x, y, z]}><sphereGeometry args={[r, 10, 8]} /><meshStandardMaterial color={FOLIAGE_COLORS[i]} roughness={0.9} /></mesh>
        ))}
      </group>

      {/* Wall clock */}
      <group position={[1.5, 1.2, wallZ + 0.02]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.14, 0.14, 0.018, 28]} /><meshStandardMaterial color={CLOCK_FACE} roughness={0.5} /></mesh>
        <mesh><torusGeometry args={[0.14, 0.012, 8, 32]} /><meshStandardMaterial color={CLOCK_FRAME} roughness={0.5} metalness={0.4} /></mesh>
        <mesh position={[-0.025, 0.03, 0.01]} rotation={[0, 0, Math.PI / 3]}><boxGeometry args={[0.01, 0.08, 0.003]} /><meshStandardMaterial color="#222222" /></mesh>
        <mesh position={[0.035, -0.04, 0.01]} rotation={[0, 0, -Math.PI / 4]}><boxGeometry args={[0.008, 0.11, 0.003]} /><meshStandardMaterial color="#222222" /></mesh>
        <mesh position={[0, 0, 0.012]}><sphereGeometry args={[0.008, 8, 8]} /><meshStandardMaterial color="#222222" /></mesh>
      </group>

      {/* Whiteboard */}
      <group position={[-2.5, 1.1, wallZ + 0.02]}>
        <mesh castShadow><boxGeometry args={[1.2, 0.8, 0.02]} /><meshStandardMaterial color={BOARD_WHITE} roughness={0.3} /></mesh>
        <mesh position={[0, 0.4, 0.005]}><boxGeometry args={[1.24, 0.03, 0.025]} /><meshStandardMaterial color={BOARD_FRAME} roughness={0.4} metalness={0.3} /></mesh>
        <mesh position={[0, -0.4, 0.005]}><boxGeometry args={[1.24, 0.03, 0.025]} /><meshStandardMaterial color={BOARD_FRAME} roughness={0.4} metalness={0.3} /></mesh>
        <mesh position={[-0.6, 0, 0.005]}><boxGeometry args={[0.03, 0.8, 0.025]} /><meshStandardMaterial color={BOARD_FRAME} roughness={0.4} metalness={0.3} /></mesh>
        <mesh position={[0.6, 0, 0.005]}><boxGeometry args={[0.03, 0.8, 0.025]} /><meshStandardMaterial color={BOARD_FRAME} roughness={0.4} metalness={0.3} /></mesh>
        <mesh position={[0, -0.43, 0.035]}><boxGeometry args={[0.8, 0.03, 0.05]} /><meshStandardMaterial color={COOLER_TRAY} roughness={0.4} metalness={0.3} /></mesh>
        {MARKER_COLORS.map((color, i) => (
          <mesh key={`marker-${i}`} position={[-0.1 + i * 0.1, -0.41, 0.04]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.008, 0.008, 0.05, 6]} /><meshStandardMaterial color={color} roughness={0.6} />
          </mesh>
        ))}
      </group>

      {/* Break Room sign */}
      <Billboard position={[0, 1.5, wallZ + 0.2]}>
        <Text fontSize={0.12} color="#888888" anchorX="center" font={undefined}>Break Room</Text>
      </Billboard>
    </group>
  );
}
