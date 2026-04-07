'use client';
import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

const PAN_SPEED = 0.12;
const INPUT_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

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
      // Don't capture WASD when typing in form fields
      if (INPUT_TAGS.has((document.activeElement?.tagName || '').toUpperCase())) return;
      if (['w', 'a', 's', 'd'].includes(e.key.toLowerCase())) {
        keysRef.current.add(e.key.toLowerCase());
      }
    };
    const onUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key.toLowerCase());
    };
    // Clear stuck keys when focus changes (e.g., user clicks a dropdown while holding W)
    const onFocusIn = () => {
      keysRef.current.clear();
    };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    document.addEventListener('focusin', onFocusIn);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
      document.removeEventListener('focusin', onFocusIn);
      keysRef.current.clear();
    };
  }, []);

  useFrame(() => {
    const keys = keysRef.current;
    if (keys.size === 0 || !controlsRef.current) return;

    let dx = 0;
    let dz = 0;
    if (keys.has('w')) dz -= PAN_SPEED;
    if (keys.has('s')) dz += PAN_SPEED;
    if (keys.has('a')) dx -= PAN_SPEED;
    if (keys.has('d')) dx += PAN_SPEED;

    const target = controlsRef.current.target as THREE.Vector3;
    const prevTX = target.x;
    const prevTZ = target.z;
    target.x = THREE.MathUtils.clamp(target.x + dx, -halfW, halfW);
    target.z = THREE.MathUtils.clamp(target.z + dz, -halfD, halfD);
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
