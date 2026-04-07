'use client';

import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard, Text } from '@react-three/drei';
import * as THREE from 'three';
import { AGENT_SCALE, LERP_SPEED, MOVEMENT_THRESHOLD, getCorridorPath } from '../core/constants';
import { getAppearance } from '../core/appearance';
import type { AgentState } from '@/lib/adapter';

interface VoxelAgentProps {
  agent: AgentState;
  targetPosition: [number, number, number];
  onAgentClick?: (agent: AgentState) => void;
}

// Deterministic personality from agent ID
function hashPersonality(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (Math.imul(31, h) + id.charCodeAt(i)) | 0;
  const rng = () => { h = (h ^ (h >>> 16)) * 0x45d9f3b; h = h ^ (h >>> 16); return ((h >>> 0) % 1000) / 1000; };
  return {
    speedMultiplier: 0.6 + rng() * 0.8,    // 0.6-1.4x
    walkAnimSpeed: 0.12 + rng() * 0.08,     // 0.12-0.20
    idlePhaseOffset: rng() * Math.PI * 2,   // 0-2π
    breathRate: 0.015 + rng() * 0.015,      // 0.015-0.030
  };
}

const ACTIVITY_COLORS: Record<string, string> = {
  working: '#f5a623',
  thinking: '#5b9bd5',
  reviewing: '#5b9bd5',
  discussing: '#00d4ff',
  blocked: '#e74c3c',
};

export default function VoxelAgent({ agent, targetPosition, onAgentClick }: VoxelAgentProps) {
  // Reset cursor on unmount to prevent cursor leak if agent removed while hovered
  useEffect(() => {
    return () => { document.body.style.cursor = 'default'; };
  }, []);

  const groupRef = useRef<THREE.Group>(null!);
  const leftArmRef = useRef<THREE.Group>(null!);
  const rightArmRef = useRef<THREE.Group>(null!);
  const leftLegRef = useRef<THREE.Group>(null!);
  const rightLegRef = useRef<THREE.Group>(null!);
  const bodyGroupRef = useRef<THREE.Group>(null!);
  const frameCount = useRef(0);

  const appearance = useMemo(() => getAppearance(agent.characterType), [agent.characterType]);
  const personality = useMemo(() => hashPersonality(agent.id), [agent.id]);

  // Waypoint-based corridor movement
  const waypointsRef = useRef<[number, number, number][]>([]);
  const waypointIndexRef = useRef(0);
  const prevTargetRef = useRef<[number, number, number]>([NaN, NaN, NaN]);

  const [tx, ty, tz] = targetPosition;
  const [px, py, pz] = prevTargetRef.current;
  if (tx !== px || ty !== py || tz !== pz) {
    prevTargetRef.current = targetPosition;
    const currentPos = groupRef.current
      ? [groupRef.current.position.x, groupRef.current.position.y, groupRef.current.position.z] as [number, number, number]
      : targetPosition;
    waypointsRef.current = getCorridorPath(currentPos, targetPosition);
    waypointIndexRef.current = 0;
  }

  const roleLabel = agent.role || 'Agent';

  useFrame(() => {
    if (!groupRef.current) return;
    frameCount.current += 1;

    const waypoints = waypointsRef.current;
    const wpIdx = waypointIndexRef.current;
    const currentWaypoint = waypoints[wpIdx] || targetPosition;

    const pos = groupRef.current.position;
    const dx = currentWaypoint[0] - pos.x;
    const dy = currentWaypoint[1] - pos.y;
    const dz = currentWaypoint[2] - pos.z;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

    const isMoving = dist > MOVEMENT_THRESHOLD;
    const f = frameCount.current;
    const speed = LERP_SPEED * personality.speedMultiplier;

    if (isMoving) {
      pos.x += dx * speed;
      pos.y += dy * speed;
      pos.z += dz * speed;
      const angle = Math.atan2(dx, dz);
      groupRef.current.rotation.y = angle;
    } else if (wpIdx < waypoints.length - 1) {
      waypointIndexRef.current += 1;
    }

    // Detect seated: not moving, has activity, and target Y > 0.1 (chair height)
    const isSeated = !isMoving && agent.activity && targetPosition[1] > 0.1;

    if (isSeated) {
      // Seated pose: bent legs, typing motion
      if (leftLegRef.current) leftLegRef.current.rotation.x = -1.5;
      if (rightLegRef.current) rightLegRef.current.rotation.x = -1.5;
      // Typing: rapid alternating arm motion
      const typeSpeed = 0.25;
      if (leftArmRef.current) leftArmRef.current.rotation.x = Math.sin(f * typeSpeed) * 0.15 - 0.3;
      if (rightArmRef.current) rightArmRef.current.rotation.x = Math.sin(f * typeSpeed + Math.PI) * 0.15 - 0.3;
      // Subtle breathing + forward lean
      if (bodyGroupRef.current) {
        bodyGroupRef.current.position.y = Math.sin(f * personality.breathRate) * 0.003;
        bodyGroupRef.current.rotation.x = 0.05;
      }
    } else if (isMoving) {
      const swing = Math.sin(f * personality.walkAnimSpeed);
      if (leftArmRef.current) leftArmRef.current.rotation.x = swing * 0.4;
      if (rightArmRef.current) rightArmRef.current.rotation.x = -swing * 0.4;
      if (leftLegRef.current) leftLegRef.current.rotation.x = -swing * 0.35;
      if (rightLegRef.current) rightLegRef.current.rotation.x = swing * 0.35;
      if (bodyGroupRef.current) {
        bodyGroupRef.current.position.y = Math.abs(Math.sin(f * personality.walkAnimSpeed)) * 0.03;
        bodyGroupRef.current.rotation.x = 0;
      }
    } else {
      // Idle: per-agent breathing + gentle sway
      const phase = personality.idlePhaseOffset;
      const breath = Math.sin(f * personality.breathRate + phase) * 0.005;
      if (leftArmRef.current) leftArmRef.current.rotation.x = Math.sin(f * 0.008 + phase) * 0.03;
      if (rightArmRef.current) rightArmRef.current.rotation.x = Math.sin(f * 0.008 + phase + 1) * 0.03;
      if (leftLegRef.current) leftLegRef.current.rotation.x = 0;
      if (rightLegRef.current) rightLegRef.current.rotation.x = 0;
      if (bodyGroupRef.current) {
        bodyGroupRef.current.position.y = breath;
        bodyGroupRef.current.rotation.x = 0;
      }
    }
  });

  return (
    <group
      ref={groupRef}
      position={targetPosition}
      scale={AGENT_SCALE}
      onClick={(e) => { e.stopPropagation(); onAgentClick?.(agent); }}
      onPointerOver={() => { if (onAgentClick) document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { document.body.style.cursor = 'default'; }}
    >
      <group ref={bodyGroupRef}>
        {/* Torso */}
        <mesh position={[0, 0.42, 0]}><boxGeometry args={[0.2, 0.24, 0.12]} /><meshLambertMaterial color={appearance.topColor} /></mesh>
        {/* Head */}
        <mesh position={[0, 0.66, 0]}><boxGeometry args={[0.16, 0.16, 0.14]} /><meshLambertMaterial color={appearance.skinColor} /></mesh>
        {/* Hair */}
        <mesh position={[0, 0.76, 0]}><boxGeometry args={[0.17, 0.04, 0.15]} /><meshLambertMaterial color={appearance.hairColor} /></mesh>
        {/* Eyes */}
        <mesh position={[-0.04, 0.68, 0.07]}><sphereGeometry args={[0.015, 8, 8]} /><meshStandardMaterial color="#222222" /></mesh>
        <mesh position={[0.04, 0.68, 0.07]}><sphereGeometry args={[0.015, 8, 8]} /><meshStandardMaterial color="#222222" /></mesh>
        {/* Mouth */}
        <mesh position={[0, 0.62, 0.07]}><boxGeometry args={[0.04, 0.01, 0.01]} /><meshLambertMaterial color="#8b5a3a" /></mesh>

        {/* Left Arm */}
        <group ref={leftArmRef} position={[-0.14, 0.48, 0]}>
          <mesh position={[0, -0.1, 0]}><boxGeometry args={[0.06, 0.2, 0.06]} /><meshLambertMaterial color={appearance.topColor} /></mesh>
          <mesh position={[0, -0.22, 0]}><boxGeometry args={[0.05, 0.05, 0.05]} /><meshLambertMaterial color={appearance.skinColor} /></mesh>
        </group>
        {/* Right Arm */}
        <group ref={rightArmRef} position={[0.14, 0.48, 0]}>
          <mesh position={[0, -0.1, 0]}><boxGeometry args={[0.06, 0.2, 0.06]} /><meshLambertMaterial color={appearance.topColor} /></mesh>
          <mesh position={[0, -0.22, 0]}><boxGeometry args={[0.05, 0.05, 0.05]} /><meshLambertMaterial color={appearance.skinColor} /></mesh>
        </group>
        {/* Left Leg */}
        <group ref={leftLegRef} position={[-0.06, 0.28, 0]}>
          <mesh position={[0, -0.1, 0]}><boxGeometry args={[0.07, 0.18, 0.08]} /><meshLambertMaterial color={appearance.trouserColor} /></mesh>
          <mesh position={[0, -0.21, 0.01]}><boxGeometry args={[0.07, 0.04, 0.1]} /><meshLambertMaterial color={appearance.shoeColor} /></mesh>
        </group>
        {/* Right Leg */}
        <group ref={rightLegRef} position={[0.06, 0.28, 0]}>
          <mesh position={[0, -0.1, 0]}><boxGeometry args={[0.07, 0.18, 0.08]} /><meshLambertMaterial color={appearance.trouserColor} /></mesh>
          <mesh position={[0, -0.21, 0.01]}><boxGeometry args={[0.07, 0.04, 0.1]} /><meshLambertMaterial color={appearance.shoeColor} /></mesh>
        </group>
      </group>

      {/* Shadow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[0.12, 16]} /><meshBasicMaterial color="#000000" transparent opacity={0.15} />
      </mesh>

      {/* Nameplate */}
      <Billboard position={[0, 0.95, 0]}>
        <Text fontSize={0.06} color="#ffffff" anchorX="center" anchorY="bottom" outlineWidth={0.005} outlineColor="#000000">{agent.displayName}</Text>
        <Text fontSize={0.04} color="#aaaaaa" anchorX="center" anchorY="top" position={[0, -0.01, 0]}>{roleLabel}</Text>
      </Billboard>

      {/* Activity bubble */}
      {agent.activity && (
        <Billboard position={[0, 1.1, 0]}>
          <mesh position={[0, 0, -0.003]}>
            <planeGeometry args={[0.55, 0.08]} />
            <meshBasicMaterial color="#0a0a18" transparent opacity={0.85} />
          </mesh>
          <Text
            fontSize={0.04}
            color={ACTIVITY_COLORS[agent.activity] || '#888888'}
            anchorX="center"
            anchorY="middle"
            maxWidth={0.5}
          >
            {agent.activityMeta?.task
              ? String(agent.activityMeta.task).slice(0, 40)
              : agent.activity.toUpperCase()}
          </Text>
        </Billboard>
      )}

      {/* Chat bubble (ephemeral) */}
      {agent.lastMessage && (
        <Billboard position={[0.2, 1.25, 0]}>
          <mesh position={[0, 0, -0.003]}>
            <planeGeometry args={[0.6, 0.1]} />
            <meshBasicMaterial color="#1a1a30" transparent opacity={0.9} />
          </mesh>
          <Text fontSize={0.035} color="#e0e0e0" anchorX="center" anchorY="middle" maxWidth={0.55}>
            {agent.lastMessage.slice(0, 50)}
          </Text>
        </Billboard>
      )}
    </group>
  );
}
