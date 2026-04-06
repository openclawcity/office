'use client';
import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

const PAN_SPEED = 0.12;

interface OfficeCameraProps {
  roomWidth: number;
  roomDepth: number;
}

export default function OfficeCamera({ roomWidth, roomDepth }: OfficeCameraProps) {
  const controlsRef = useRef<any>(null);
  const keysRef = useRef<Set<string>>(new Set());
  const { camera } = useThree();

  const halfW = roomWidth / 2;
  const halfD = roomDepth / 2;

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      if (['w', 'a', 's', 'd'].includes(e.key.toLowerCase())) {
        keysRef.current.add(e.key.toLowerCase());
      }
    };
    const onUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key.toLowerCase());
    };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, []);

  useFrame(() => {
    const keys = keysRef.current;
    if (keys.size === 0 || !controlsRef.current) return;

    const delta = new THREE.Vector3(0, 0, 0);
    if (keys.has('w')) delta.z -= PAN_SPEED;
    if (keys.has('s')) delta.z += PAN_SPEED;
    if (keys.has('a')) delta.x -= PAN_SPEED;
    if (keys.has('d')) delta.x += PAN_SPEED;

    const target = controlsRef.current.target as THREE.Vector3;
    const prevTX = target.x;
    const prevTZ = target.z;
    target.x = THREE.MathUtils.clamp(target.x + delta.x, -halfW, halfW);
    target.z = THREE.MathUtils.clamp(target.z + delta.z, -halfD, halfD);
    camera.position.x += target.x - prevTX;
    camera.position.z += target.z - prevTZ;
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.08}
      maxPolarAngle={Math.PI / 2.2}
      minZoom={25}
      maxZoom={120}
      enablePan
      panSpeed={0.8}
    />
  );
}
