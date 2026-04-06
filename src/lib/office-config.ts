export interface DeskConfig {
  id: string;
  label: string;
  agentName?: string;
  role?: string;
}

export interface OfficeConfig {
  name: string;
  desks: DeskConfig[];
  roomSize?: { width: number; depth: number; height?: number };
  theme?: {
    wallColor?: string;
    floorColor?: string;
    accentColor?: string;
  };
}

export const PRESETS: Record<string, Omit<OfficeConfig, 'name'>> = {
  startup: {
    desks: [
      { id: 'eng1', label: 'Engineering', role: 'Engineer' },
      { id: 'eng2', label: 'Engineering', role: 'Engineer' },
      { id: 'design', label: 'Design', role: 'Designer' },
      { id: 'product', label: 'Product', role: 'PM' },
    ],
    roomSize: { width: 11, depth: 9 },
    theme: { accentColor: '#00e676' },
  },
  corporate: {
    desks: [
      { id: 'research', label: 'Research', role: 'Analyst' },
      { id: 'content', label: 'Content', role: 'Writer' },
      { id: 'strategy', label: 'Strategy', role: 'Strategist' },
      { id: 'design', label: 'Design', role: 'Designer' },
      { id: 'outreach', label: 'Outreach', role: 'Specialist' },
      { id: 'events', label: 'Events', role: 'Coordinator' },
    ],
    roomSize: { width: 13, depth: 10 },
    theme: { accentColor: '#1565C0' },
  },
  creative: {
    desks: [
      { id: 'art', label: 'Art', role: 'Artist' },
      { id: 'music', label: 'Music', role: 'Musician' },
      { id: 'writing', label: 'Writing', role: 'Writer' },
    ],
    roomSize: { width: 10, depth: 8 },
    theme: { wallColor: '#4a3a5a', accentColor: '#ff3b7a' },
  },
  minimal: {
    desks: [
      { id: 'desk1', label: 'Agent 1' },
      { id: 'desk2', label: 'Agent 2' },
    ],
    roomSize: { width: 8, depth: 7 },
  },
};
