'use client';

import { Billboard, Text } from '@react-three/drei';
import { useMemo } from 'react';

interface DeskProps {
  position: [number, number, number];
  label: string;
  accentColor?: string;
  rotation?: number;
  onDeskClick?: () => void;
}

const DESKTOP_COLOR = '#5a3e28';
const LEG_COLOR = '#c0c0c0';
const MONITOR_SHELL = '#1a1a1e';
const SCREEN_COLOR = '#0a1520';
const SCREEN_EMISSIVE = '#2a4a6a';
const NECK_COLOR = '#888888';
const KB_BASE = '#2a2a30';
const KB_KEYS = '#3a3a42';
const MOUSE_COLOR = '#d8d4d0';
const MUG_COLOR = '#2d4f73';
const COFFEE_COLOR = '#1a0e05';
const PEN_HOLDER = '#333333';
const CHAIR_FABRIC = '#2a2a32';
const CHAIR_LUMBAR = '#3a3a42';
const CHAIR_METAL = '#555555';
const WHEEL_COLOR = '#333333';

const STICKY_PALETTE = ['#f7db5e', '#ffb35c', '#97d7f6', '#c0e56e', '#ff8fa3'];
const PEN_COLORS = ['#222222', '#c0392b', '#2980b9'];

function seedRandom(label: string) {
  let h = 0;
  for (let i = 0; i < label.length; i++) {
    h = (Math.imul(31, h) + label.charCodeAt(i)) | 0;
  }
  return () => {
    h = (h ^ (h >>> 16)) * 0x45d9f3b;
    h = (h ^ (h >>> 16)) * 0x45d9f3b;
    h = h ^ (h >>> 16);
    return ((h >>> 0) % 10000) / 10000;
  };
}

const LEG_OFFSETS: [number, number][] = [[-0.68, -0.32], [0.68, -0.32], [-0.68, 0.32], [0.68, 0.32]];
const WHEEL_ANGLES = Array.from({ length: 5 }, (_, i) => (i * 2 * Math.PI) / 5);
const ARM_LENGTH = 0.2;
const KEY_ROWS = [-0.032, -0.011, 0.011, 0.032];

export default function Desk({ position, label, accentColor = '#00d4ff', rotation = 0, onDeskClick }: DeskProps) {
  const clutter = useMemo(() => {
    const rand = seedRandom(label);
    const stickyCount = 2 + Math.floor(rand() * 2);
    const stickies = Array.from({ length: stickyCount }, () => ({
      x: -0.5 + rand() * 1.0,
      z: -0.25 + rand() * 0.5,
      rotY: (rand() - 0.5) * 0.6,
      color: STICKY_PALETTE[Math.floor(rand() * STICKY_PALETTE.length)],
    }));
    const penCount = 2 + Math.floor(rand() * 2);
    const pens = Array.from({ length: penCount }, (_, i) => ({
      offsetX: (rand() - 0.5) * 0.012,
      offsetZ: (rand() - 0.5) * 0.012,
      tilt: (rand() - 0.5) * 0.4,
      color: PEN_COLORS[i % PEN_COLORS.length],
    }));
    return { stickies, pens };
  }, [label]);

  const deskY = 0.72;

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Desktop */}
      <mesh
        position={[0, deskY, 0]}
        castShadow
        receiveShadow
        onPointerOver={() => { if (onDeskClick) document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { document.body.style.cursor = 'default'; }}
        onPointerDown={(e) => { e.stopPropagation(); onDeskClick?.(); }}
      >
        <boxGeometry args={[1.5, 0.04, 0.75]} />
        <meshStandardMaterial color={DESKTOP_COLOR} roughness={0.65} metalness={0.05} />
      </mesh>

      {/* 4 Legs */}
      {LEG_OFFSETS.map(([x, z], i) => (
        <mesh key={`leg-${i}`} position={[x, deskY / 2, z]} castShadow>
          <boxGeometry args={[0.035, deskY, 0.035]} />
          <meshStandardMaterial color={LEG_COLOR} roughness={0.3} metalness={0.6} />
        </mesh>
      ))}

      {/* Monitor */}
      <group position={[0, deskY + 0.02, -0.25]}>
        <mesh position={[0, 0.005, 0]}><cylinderGeometry args={[0.06, 0.06, 0.01, 16]} /><meshStandardMaterial color={NECK_COLOR} roughness={0.4} metalness={0.4} /></mesh>
        <mesh position={[0, 0.05, 0]}><cylinderGeometry args={[0.015, 0.015, 0.08, 8]} /><meshStandardMaterial color={NECK_COLOR} roughness={0.4} metalness={0.4} /></mesh>
        <mesh position={[0, 0.21, 0]} castShadow><boxGeometry args={[0.32, 0.22, 0.025]} /><meshStandardMaterial color={MONITOR_SHELL} roughness={0.4} metalness={0.3} /></mesh>
        <mesh position={[0, 0.21, 0.015]}><boxGeometry args={[0.30, 0.20, 0.005]} /><meshStandardMaterial color={SCREEN_COLOR} emissive={SCREEN_EMISSIVE} emissiveIntensity={0.4} roughness={0.1} /></mesh>
      </group>

      {/* Keyboard */}
      <group position={[0, deskY + 0.02, 0.05]}>
        <mesh position={[0, 0.009, 0]}><boxGeometry args={[0.30, 0.018, 0.11]} /><meshStandardMaterial color={KB_BASE} roughness={0.8} /></mesh>
        {KEY_ROWS.map((z, i) => (
          <mesh key={`kr-${i}`} position={[0, 0.019, z]}><boxGeometry args={[0.27, 0.004, 0.018]} /><meshStandardMaterial color={KB_KEYS} roughness={0.7} /></mesh>
        ))}
      </group>

      {/* Mouse */}
      <group position={[0.26, deskY + 0.02, 0.05]}>
        <mesh position={[0, 0.012, 0]} scale={[1, 0.4, 0.7]}><sphereGeometry args={[0.03, 12, 8]} /><meshStandardMaterial color={MOUSE_COLOR} roughness={0.5} /></mesh>
        <mesh position={[0, 0.02, -0.005]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.004, 0.004, 0.01, 6]} /><meshStandardMaterial color="#555555" roughness={0.6} metalness={0.3} /></mesh>
      </group>

      {/* Mug */}
      <group position={[-0.55, deskY + 0.02, -0.15]}>
        <mesh position={[0, 0.03, 0]}><cylinderGeometry args={[0.028, 0.028, 0.06, 14]} /><meshStandardMaterial color={MUG_COLOR} roughness={0.4} /></mesh>
        <mesh position={[0.035, 0.03, 0]} rotation={[0, 0, Math.PI / 2]}><torusGeometry args={[0.02, 0.005, 6, 12, Math.PI]} /><meshStandardMaterial color={MUG_COLOR} roughness={0.4} /></mesh>
        <mesh position={[0, 0.055, 0]}><cylinderGeometry args={[0.025, 0.025, 0.004, 14]} /><meshStandardMaterial color={COFFEE_COLOR} roughness={0.9} /></mesh>
      </group>

      {/* Sticky notes */}
      {clutter.stickies.map((s, i) => (
        <mesh key={`sticky-${i}`} position={[s.x, deskY + 0.025, s.z]} rotation={[0, s.rotY, 0]}>
          <boxGeometry args={[0.04, 0.003, 0.04]} /><meshStandardMaterial color={s.color} roughness={0.9} />
        </mesh>
      ))}

      {/* Pen holder + pens */}
      <group position={[0.55, deskY + 0.02, -0.2]}>
        <mesh position={[0, 0.03, 0]}><cylinderGeometry args={[0.02, 0.02, 0.06, 10]} /><meshStandardMaterial color={PEN_HOLDER} roughness={0.7} metalness={0.2} /></mesh>
        {clutter.pens.map((p, i) => (
          <mesh key={`pen-${i}`} position={[p.offsetX, 0.07, p.offsetZ]} rotation={[p.tilt, 0, (i - 1) * 0.15]}>
            <cylinderGeometry args={[0.003, 0.003, 0.06, 4]} /><meshStandardMaterial color={p.color} roughness={0.6} />
          </mesh>
        ))}
      </group>

      {/* Office Chair */}
      <group position={[0, 0, 0.55]} rotation={[0, Math.PI, 0]}>
        {WHEEL_ANGLES.map((angle, i) => {
          const ax = Math.sin(angle) * ARM_LENGTH * 0.5;
          const az = Math.cos(angle) * ARM_LENGTH * 0.5;
          const wx = Math.sin(angle) * ARM_LENGTH;
          const wz = Math.cos(angle) * ARM_LENGTH;
          return (
            <group key={`arm-${i}`}>
              <mesh position={[ax, 0.02, az]} rotation={[0, -angle, 0]}><boxGeometry args={[0.02, 0.015, ARM_LENGTH]} /><meshStandardMaterial color={CHAIR_METAL} roughness={0.4} metalness={0.5} /></mesh>
              <mesh position={[wx, 0.018, wz]}><sphereGeometry args={[0.018, 8, 6]} /><meshStandardMaterial color={WHEEL_COLOR} roughness={0.9} /></mesh>
            </group>
          );
        })}
        <mesh position={[0, 0.17, 0]}><cylinderGeometry args={[0.025, 0.025, 0.25, 8]} /><meshStandardMaterial color={CHAIR_METAL} roughness={0.4} metalness={0.5} /></mesh>
        <mesh position={[0, 0.32, 0]} castShadow receiveShadow><boxGeometry args={[0.42, 0.05, 0.42]} /><meshStandardMaterial color={CHAIR_FABRIC} roughness={0.85} /></mesh>
        <mesh position={[0, 0.62, -0.2]} rotation={[0.087, 0, 0]} castShadow><boxGeometry args={[0.42, 0.5, 0.04]} /><meshStandardMaterial color={CHAIR_FABRIC} roughness={0.85} /></mesh>
        <mesh position={[0, 0.5, -0.18]} rotation={[0.087, 0, 0]}><boxGeometry args={[0.36, 0.12, 0.03]} /><meshStandardMaterial color={CHAIR_LUMBAR} roughness={0.8} /></mesh>
      </group>

      {/* Holographic label */}
      <Billboard position={[0, 1.35, 0]}>
        <mesh position={[0, 0, -0.005]}><planeGeometry args={[0.7, 0.14]} /><meshBasicMaterial color="#0a0a18" transparent opacity={0.85} /></mesh>
        <mesh position={[0, 0.065, -0.004]}><planeGeometry args={[0.7, 0.005]} /><meshBasicMaterial color={accentColor} transparent opacity={0.6} /></mesh>
        <Text fontSize={0.065} color={accentColor} anchorX="center" anchorY="middle" font={undefined} outlineWidth={0.002} outlineColor="#003355">
          {label}
        </Text>
      </Billboard>
    </group>
  );
}
