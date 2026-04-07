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

// Break room wander points — idle agents cycle through these
export const WANDER_POINTS: [number, number, number][] = [
  [-3.5, 0, 3.5],   // Near sofa left end
  [-2,   0, 3.0],   // In front of sofa
  [-1,   0, 3.8],   // Behind coffee table
  [0.5,  0, 3.2],   // Center of break room
  [1.5,  0, 2.5],   // Near door entrance
  [-0.5, 0, 4.0],   // Back wall area
  [2.5,  0, 3.5],   // Near water cooler
  [-2.5, 0, 2.8],   // Sofa approach
  [0,    0, 3.6],   // Near coffee table
  [1.0,  0, 4.0],   // Back right corner
];

// Per-agent wander personality (timing)
export interface WanderPersonality {
  minDelay: number;
  maxDelay: number;
  initialDelay: number;
}

export const WANDER_PERSONALITIES: WanderPersonality[] = [
  { minDelay: 6000, maxDelay: 12000, initialDelay: 500 },
  { minDelay: 10000, maxDelay: 20000, initialDelay: 4000 },
  { minDelay: 8000, maxDelay: 16000, initialDelay: 8000 },
  { minDelay: 9000, maxDelay: 18000, initialDelay: 2000 },
  { minDelay: 7000, maxDelay: 14000, initialDelay: 12000 },
  { minDelay: 11000, maxDelay: 22000, initialDelay: 6000 },
  { minDelay: 12000, maxDelay: 24000, initialDelay: 1000 },
];

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
  seatPositions: Record<string, [number, number, number]>;
  roleToStation: Record<string, string>;
  stationLabels: Record<string, string>;
  restPositions: [number, number, number][];
  roomWidth: number;
  roomDepth: number;
  roomHeight: number;
}

export function generateLayout(config: OfficeConfig): OfficeLayout {
  const roomWidth = Math.max(config.roomSize?.width || DEFAULT_ROOM_WIDTH, 4);
  const roomDepth = Math.max(config.roomSize?.depth || DEFAULT_ROOM_DEPTH, 4);
  const roomHeight = Math.max(config.roomSize?.height || DEFAULT_ROOM_HEIGHT, 1);
  const desks = config.desks;

  if (desks.length === 0) {
    const restPositions: [number, number, number][] = Array.from(
      { length: 6 },
      (_, i) => [(i % 3 - 1) * 1.5, 0, 3.2 + Math.floor(i / 3) * 0.6],
    );
    return { workstations: {}, seatPositions: {}, roleToStation: {}, stationLabels: {}, restPositions, roomWidth, roomDepth, roomHeight };
  }

  const clamped = desks.slice(0, 12);
  const cols = Math.min(clamped.length, 3);
  const rows = Math.ceil(clamped.length / cols);

  const workZoneStart = -roomDepth / 2 + 2;
  const workZoneEnd = PARTITION_Z - 0.5;
  const xUsable = roomWidth * 0.6;

  const workstations: Record<string, [number, number, number]> = {};
  const seatPositions: Record<string, [number, number, number]> = {};
  const roleToStation: Record<string, string> = {};
  const stationLabels: Record<string, string> = {};

  clamped.forEach((desk, i) => {
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
    // Seat position: chair is z+0.55 behind desk, y=0.21 for seated height
    seatPositions[key] = [x, 0.21, z + 0.55];
    stationLabels[key] = desk.label;
    if (desk.agentName) roleToStation[desk.agentName] = key;
  });

  const restPositions: [number, number, number][] = Array.from(
    { length: 6 },
    (_, i) => [(i % 3 - 1) * 1.5, 0, 3.2 + Math.floor(i / 3) * 0.6],
  );

  return { workstations, seatPositions, roleToStation, stationLabels, restPositions, roomWidth, roomDepth, roomHeight };
}
