import type { OfficeConfig } from '@/lib/office-config';

// Default room dimensions
export const DEFAULT_ROOM_WIDTH = 13;
export const DEFAULT_ROOM_DEPTH = 10;
export const DEFAULT_ROOM_HEIGHT = 1.5;
export const PARTITION_Z = 1.8;

// Agent animation constants
export const AGENT_SCALE = 1.5;
export const LERP_SPEED = 0.08;
export const WALK_ANIM_SPEED = 0.15;
export const MOVEMENT_THRESHOLD = 0.05;

// Corridor pathfinding
export const CORRIDOR_Z_RANGE: [number, number] = [-4.5, 4.5];
export const CORRIDOR_X = 0;

export function getCorridorPath(
  from: [number, number, number],
  to: [number, number, number],
): [number, number, number][] {
  const dx = Math.abs(from[0] - to[0]);
  const dz = Math.abs(from[2] - to[2]);
  if (dx < 2 && dz < 2) return [to];

  return [
    [CORRIDOR_X, 0, from[2]],
    [CORRIDOR_X, 0, to[2]],
    to,
  ];
}

export interface OfficeLayout {
  workstations: Record<string, [number, number, number]>;
  roleToStation: Record<string, string>;
  stationLabels: Record<string, string>;
  restPositions: [number, number, number][];
  roomWidth: number;
  roomDepth: number;
  roomHeight: number;
}

export function generateLayout(config: OfficeConfig): OfficeLayout {
  const roomWidth = config.roomSize?.width || DEFAULT_ROOM_WIDTH;
  const roomDepth = config.roomSize?.depth || DEFAULT_ROOM_DEPTH;
  const roomHeight = config.roomSize?.height || DEFAULT_ROOM_HEIGHT;
  const desks = config.desks;

  const cols = Math.min(desks.length, 3);
  const rows = Math.ceil(desks.length / cols);

  // Work area is from back wall to partition (z from -roomDepth/2 to PARTITION_Z)
  const workZoneStart = -roomDepth / 2 + 2;
  const workZoneEnd = PARTITION_Z - 0.5;
  const xUsable = roomWidth * 0.6;

  const workstations: Record<string, [number, number, number]> = {};
  const roleToStation: Record<string, string> = {};
  const stationLabels: Record<string, string> = {};

  desks.forEach((desk, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);

    const x = cols === 1
      ? 0
      : -xUsable / 2 + (col / (cols - 1)) * xUsable;

    const z = rows === 1
      ? (workZoneStart + workZoneEnd) / 2
      : workZoneStart + (row / (rows - 1)) * (workZoneEnd - workZoneStart);

    const key = desk.id;
    workstations[key] = [x, 0, z];
    stationLabels[key] = desk.label;
    if (desk.agentName) roleToStation[desk.agentName] = key;
  });

  // Rest positions in break room (z > PARTITION_Z)
  const restPositions: [number, number, number][] = Array.from(
    { length: 6 },
    (_, i) => [(i % 3 - 1) * 1.5, 0, 3.2 + Math.floor(i / 3) * 0.6],
  );

  return { workstations, roleToStation, stationLabels, restPositions, roomWidth, roomDepth, roomHeight };
}
