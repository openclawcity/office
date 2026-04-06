'use client';

import { Billboard, Text } from '@react-three/drei';
import { PARTITION_Z } from '../core/constants';

interface FillerFurnitureProps {
  roomWidth: number;
  roomDepth: number;
  roomHeight: number;
  officeName: string;
  accentColor?: string;
}

const HW = (w: number) => w / 2;
const HD = (d: number) => d / 2;

/* Bookshelf */
function Bookshelf({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  const books = [
    { color: '#c0392b', x: -0.22 }, { color: '#2980b9', x: -0.12 }, { color: '#27ae60', x: -0.02 },
    { color: '#f39c12', x: 0.08 }, { color: '#8e44ad', x: 0.18 }, { color: '#e74c3c', x: -0.18 },
    { color: '#1abc9c', x: 0.28 }, { color: '#d35400', x: 0.02 },
  ];
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.6, 0]} castShadow><boxGeometry args={[0.8, 1.2, 0.3]} /><meshStandardMaterial color="#5a3e28" roughness={0.7} metalness={0.05} /></mesh>
      {[0.15, 0.5, 0.85].map((y, i) => (
        <mesh key={i} position={[0, y, 0]}><boxGeometry args={[0.76, 0.03, 0.28]} /><meshStandardMaterial color="#4a3420" roughness={0.65} /></mesh>
      ))}
      {[0.22, 0.57, 0.92].map((shelfY, si) =>
        books.slice(si * 3, si * 3 + 3).map((book, bi) => (
          <mesh key={`${si}-${bi}`} position={[book.x, shelfY + 0.08, 0]}><boxGeometry args={[0.06, 0.14, 0.18]} /><meshStandardMaterial color={book.color} roughness={0.8} /></mesh>
        ))
      )}
    </group>
  );
}

/* Filing Cabinet */
function FilingCabinet({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.4, 0]} castShadow><boxGeometry args={[0.4, 0.8, 0.35]} /><meshStandardMaterial color="#6b7280" roughness={0.7} metalness={0.3} /></mesh>
      {[0.15, 0.4, 0.65].map((y, i) => (
        <group key={i}>
          <mesh position={[0, y, 0.176]}><boxGeometry args={[0.36, 0.2, 0.005]} /><meshStandardMaterial color="#7b8490" roughness={0.6} metalness={0.25} /></mesh>
          <mesh position={[0, y, 0.185]}><boxGeometry args={[0.12, 0.02, 0.02]} /><meshStandardMaterial color="#aaa" roughness={0.3} metalness={0.6} /></mesh>
        </group>
      ))}
    </group>
  );
}

/* Partition Screen */
function PartitionScreen({ position, height = 1.2 }: { position: [number, number, number]; height?: number }) {
  return (
    <group position={position}>
      <mesh position={[0, height / 2, 0]}><boxGeometry args={[0.06, height, 1.2]} /><meshStandardMaterial color="#4a5568" roughness={0.95} /></mesh>
      <mesh position={[0, height, 0]}><boxGeometry args={[0.07, 0.03, 1.22]} /><meshStandardMaterial color="#888" roughness={0.4} metalness={0.4} /></mesh>
      {[-0.45, 0.45].map((z, i) => (
        <mesh key={i} position={[0, 0.02, z]}><boxGeometry args={[0.15, 0.04, 0.06]} /><meshStandardMaterial color="#888" roughness={0.4} metalness={0.4} /></mesh>
      ))}
    </group>
  );
}

/* Floor Plant */
function FloorPlant({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.1, 0]}><cylinderGeometry args={[0.08, 0.1, 0.2, 12]} /><meshStandardMaterial color="#6b4c30" roughness={0.8} /></mesh>
      <mesh position={[0, 0.22, 0]}><cylinderGeometry args={[0.075, 0.075, 0.02, 12]} /><meshStandardMaterial color="#3a2a1a" roughness={0.9} /></mesh>
      {[{ r: 0.1, y: 0.35, c: '#2d6b3a' }, { r: 0.08, y: 0.42, c: '#3a8a4a' }, { r: 0.12, y: 0.32, c: '#4a9a5a' }].map((leaf, i) => (
        <mesh key={i} position={[0, leaf.y, 0]}><sphereGeometry args={[leaf.r, 8, 8]} /><meshStandardMaterial color={leaf.c} roughness={0.85} /></mesh>
      ))}
    </group>
  );
}

/* Conference Table */
function ConferenceTable({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.72, 0]} castShadow><boxGeometry args={[2.0, 0.04, 0.9]} /><meshStandardMaterial color="#5a3e28" roughness={0.6} metalness={0.05} /></mesh>
      {[[-0.85, -0.35], [-0.85, 0.35], [0.85, -0.35], [0.85, 0.35]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.36, z]}><boxGeometry args={[0.04, 0.72, 0.04]} /><meshStandardMaterial color="#c0c0c0" roughness={0.3} metalness={0.6} /></mesh>
      ))}
      {[[-0.6, 0, -0.7], [0.6, 0, -0.7], [-0.6, 0, 0.7], [0.6, 0, 0.7]].map(([x, y, z], i) => (
        <group key={i} position={[x, y, z]} rotation={[0, z < 0 ? 0 : Math.PI, 0]}>
          <mesh position={[0, 0.38, 0]}><boxGeometry args={[0.35, 0.04, 0.35]} /><meshStandardMaterial color="#2a2a32" roughness={0.85} /></mesh>
          <mesh position={[0, 0.6, -0.15]} rotation={[0.1, 0, 0]}><boxGeometry args={[0.35, 0.4, 0.03]} /><meshStandardMaterial color="#2a2a32" roughness={0.85} /></mesh>
          <mesh position={[0, 0.2, 0]}><cylinderGeometry args={[0.02, 0.02, 0.36, 8]} /><meshStandardMaterial color="#555" metalness={0.5} roughness={0.3} /></mesh>
        </group>
      ))}
    </group>
  );
}

/* Ceiling Light */
function CeilingLight({ position }: { position: [number, number, number] }) {
  return (
    <mesh position={position}><boxGeometry args={[1.0, 0.03, 0.4]} /><meshStandardMaterial color="#f0ece4" emissive="#fff5e0" emissiveIntensity={0.3} roughness={0.5} /></mesh>
  );
}

/* Floor Rug */
function FloorRug({ position, width, depth, color }: { position: [number, number, number]; width: number; depth: number; color: string }) {
  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[width, depth]} /><meshStandardMaterial color={color} roughness={0.95} /></mesh>
  );
}

export default function FillerFurniture({ roomWidth, roomDepth, roomHeight, officeName, accentColor = '#00d4ff' }: FillerFurnitureProps) {
  const hw = HW(roomWidth);
  const hd = HD(roomDepth);

  return (
    <group>
      <Bookshelf position={[-hw + 0.5, 0, -hd + 0.3]} />
      <Bookshelf position={[hw - 0.5, 0, -hd + 0.3]} />

      <FilingCabinet position={[-hw + 1, 0, -2]} />
      <FilingCabinet position={[hw - 1, 0, -2]} />
      <FilingCabinet position={[-hw + 1, 0, 0.5]} />

      <PartitionScreen position={[-roomWidth * 0.17, 0, -1.75]} />
      <PartitionScreen position={[roomWidth * 0.1, 0, -1.75]} />

      <ConferenceTable position={[hw - 1.5, 0, -2]} />

      <FloorPlant position={[-hw + 0.4, 0, hd - 0.4]} />
      <FloorPlant position={[hw - 0.4, 0, hd - 0.4]} />
      <FloorPlant position={[-hw + 0.4, 0, -hd + 0.4]} />
      <FloorPlant position={[hw - 0.4, 0, -hd + 0.4]} />
      <FloorPlant position={[0, 0, PARTITION_Z - 0.3]} />

      <CeilingLight position={[-roomWidth * 0.27, roomHeight - 0.02, -2]} />
      <CeilingLight position={[0, roomHeight - 0.02, -2]} />
      <CeilingLight position={[roomWidth * 0.27, roomHeight - 0.02, -2]} />
      <CeilingLight position={[0, roomHeight - 0.02, 3.5]} />

      <FloorRug position={[hw - 1.5, 0.002, -2]} width={2.8} depth={1.6} color="#8b7355" />
      <FloorRug position={[0, 0.002, 3.5]} width={4} depth={2.5} color="#7a6b55" />

      {/* Office name sign */}
      <Billboard position={[0, roomHeight - 0.3, -hd + 0.15]}>
        <mesh position={[0, 0, -0.005]}><planeGeometry args={[2.2, 0.25]} /><meshBasicMaterial color="#0a0a18" transparent opacity={0.9} /></mesh>
        <Text fontSize={0.1} color={accentColor} anchorX="center" anchorY="middle" font={undefined} outlineWidth={0.002} outlineColor="#003355">
          {officeName}
        </Text>
      </Billboard>
    </group>
  );
}
