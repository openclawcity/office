'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard, Text } from '@react-three/drei';
import * as THREE from 'three';
import { AGENT_SCALE, LERP_SPEED, WALK_ANIM_SPEED, MOVEMENT_THRESHOLD, getCorridorPath } from '../core/constants';
import { getAppearance } from '../core/appearance';
import type { AgentState } from '../core/types';

interface VoxelAgentProps {
  agent: AgentState;
  targetPosition: [number, number, number];
}

export default function VoxelAgent({ agent, targetPosition }: VoxelAgentProps) {
  const groupRef = useRef<THREE.Group>(null!);
  const leftArmRef = useRef<THREE.Group>(null!);
  const rightArmRef = useRef<THREE.Group>(null!);
  const leftLegRef = useRef<THREE.Group>(null!);
  const rightLegRef = useRef<THREE.Group>(null!);
  const bodyGroupRef = useRef<THREE.Group>(null!);
  const frameCount = useRef(0);

  const appearance = useMemo(() => getAppearance(agent.characterType), [agent.characterType]);

  // Waypoint-based corridor movement
  const waypointsRef = useRef<[number, number, number][]>([]);
  const waypointIndexRef = useRef(0);
  const prevTargetRef = useRef<string>('');

  const targetKey = `${targetPosition[0]},${targetPosition[1]},${targetPosition[2]}`;
  if (targetKey !== prevTargetRef.current) {
    prevTargetRef.current = targetKey;
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

    if (isMoving) {
      pos.x += dx * LERP_SPEED;
      pos.y += dy * LERP_SPEED;
      pos.z += dz * LERP_SPEED;
      const angle = Math.atan2(dx, dz);
      groupRef.current.rotation.y = angle;
    } else if (wpIdx < waypoints.length - 1) {
      waypointIndexRef.current += 1;
    }

    const f = frameCount.current;

    if (isMoving) {
      const swing = Math.sin(f * WALK_ANIM_SPEED);
      if (leftArmRef.current) leftArmRef.current.rotation.x = swing * 0.4;
      if (rightArmRef.current) rightArmRef.current.rotation.x = -swing * 0.4;
      if (leftLegRef.current) leftLegRef.current.rotation.x = -swing * 0.35;
      if (rightLegRef.current) rightLegRef.current.rotation.x = swing * 0.35;
      if (bodyGroupRef.current) {
        bodyGroupRef.current.position.y = Math.abs(Math.sin(f * WALK_ANIM_SPEED)) * 0.03;
      }
    } else {
      const breath = Math.sin(f * 0.02) * 0.005;
      if (leftArmRef.current) leftArmRef.current.rotation.x = 0;
      if (rightArmRef.current) rightArmRef.current.rotation.x = 0;
      if (leftLegRef.current) leftLegRef.current.rotation.x = 0;
      if (rightLegRef.current) rightLegRef.current.rotation.x = 0;
      if (bodyGroupRef.current) {
        bodyGroupRef.current.position.y = breath;
      }
    }
  });

  return (
    <group ref={groupRef} position={targetPosition} scale={AGENT_SCALE}>
      <group ref={bodyGroupRef}>
        {/* Torso */}
        <mesh position={[0, 0.42, 0]}>
          <boxGeometry args={[0.2, 0.24, 0.12]} />
          <meshLambertMaterial color={appearance.topColor} />
        </mesh>

        {/* Head */}
        <mesh position={[0, 0.66, 0]}>
          <boxGeometry args={[0.16, 0.16, 0.14]} />
          <meshLambertMaterial color={appearance.skinColor} />
        </mesh>

        {/* Hair */}
        <mesh position={[0, 0.76, 0]}>
          <boxGeometry args={[0.17, 0.04, 0.15]} />
          <meshLambertMaterial color={appearance.hairColor} />
        </mesh>

        {/* Eyes */}
        <mesh position={[-0.04, 0.68, 0.07]}>
          <sphereGeometry args={[0.015, 8, 8]} />
          <meshStandardMaterial color="#222222" />
        </mesh>
        <mesh position={[0.04, 0.68, 0.07]}>
          <sphereGeometry args={[0.015, 8, 8]} />
          <meshStandardMaterial color="#222222" />
        </mesh>

        {/* Mouth */}
        <mesh position={[0, 0.62, 0.07]}>
          <boxGeometry args={[0.04, 0.01, 0.01]} />
          <meshLambertMaterial color="#8b5a3a" />
        </mesh>

        {/* Left Arm */}
        <group ref={leftArmRef} position={[-0.14, 0.48, 0]}>
          <mesh position={[0, -0.1, 0]}>
            <boxGeometry args={[0.06, 0.2, 0.06]} />
            <meshLambertMaterial color={appearance.topColor} />
          </mesh>
          <mesh position={[0, -0.22, 0]}>
            <boxGeometry args={[0.05, 0.05, 0.05]} />
            <meshLambertMaterial color={appearance.skinColor} />
          </mesh>
        </group>

        {/* Right Arm */}
        <group ref={rightArmRef} position={[0.14, 0.48, 0]}>
          <mesh position={[0, -0.1, 0]}>
            <boxGeometry args={[0.06, 0.2, 0.06]} />
            <meshLambertMaterial color={appearance.topColor} />
          </mesh>
          <mesh position={[0, -0.22, 0]}>
            <boxGeometry args={[0.05, 0.05, 0.05]} />
            <meshLambertMaterial color={appearance.skinColor} />
          </mesh>
        </group>

        {/* Left Leg */}
        <group ref={leftLegRef} position={[-0.06, 0.28, 0]}>
          <mesh position={[0, -0.1, 0]}>
            <boxGeometry args={[0.07, 0.18, 0.08]} />
            <meshLambertMaterial color={appearance.trouserColor} />
          </mesh>
          <mesh position={[0, -0.21, 0.01]}>
            <boxGeometry args={[0.07, 0.04, 0.1]} />
            <meshLambertMaterial color={appearance.shoeColor} />
          </mesh>
        </group>

        {/* Right Leg */}
        <group ref={rightLegRef} position={[0.06, 0.28, 0]}>
          <mesh position={[0, -0.1, 0]}>
            <boxGeometry args={[0.07, 0.18, 0.08]} />
            <meshLambertMaterial color={appearance.trouserColor} />
          </mesh>
          <mesh position={[0, -0.21, 0.01]}>
            <boxGeometry args={[0.07, 0.04, 0.1]} />
            <meshLambertMaterial color={appearance.shoeColor} />
          </mesh>
        </group>
      </group>

      {/* Shadow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[0.12, 16]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.15} />
      </mesh>

      {/* Nameplate */}
      <Billboard position={[0, 0.95, 0]}>
        <Text fontSize={0.06} color="#ffffff" anchorX="center" anchorY="bottom" outlineWidth={0.005} outlineColor="#000000">
          {agent.displayName}
        </Text>
        <Text fontSize={0.04} color="#aaaaaa" anchorX="center" anchorY="top" position={[0, -0.01, 0]}>
          {roleLabel}
        </Text>
      </Billboard>

      {/* Activity indicators */}
      {agent.activity === 'working' && (
        <mesh position={[0, 1.05, 0]}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshStandardMaterial color="#f5a623" emissive="#f5a623" emissiveIntensity={0.5} />
        </mesh>
      )}
      {agent.activity === 'thinking' && (
        <group position={[0.12, 0.85, 0]}>
          <mesh><sphereGeometry args={[0.015, 6, 6]} /><meshBasicMaterial color="#cccccc" /></mesh>
          <mesh position={[0.04, 0.04, 0]}><sphereGeometry args={[0.02, 6, 6]} /><meshBasicMaterial color="#cccccc" /></mesh>
          <mesh position={[0.08, 0.1, 0]}><sphereGeometry args={[0.025, 6, 6]} /><meshBasicMaterial color="#cccccc" /></mesh>
        </group>
      )}
      {agent.activity === 'blocked' && (
        <mesh position={[0, 1.05, 0]}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshStandardMaterial color="#e74c3c" emissive="#e74c3c" emissiveIntensity={0.5} />
        </mesh>
      )}
    </group>
  );
}
