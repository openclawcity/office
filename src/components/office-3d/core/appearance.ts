import type { AgentAppearance } from './types';

const APPEARANCES: Record<string, AgentAppearance> = {
  'agent-scholar':  { skinColor: '#e8c4a0', topColor: '#1a3a6b', trouserColor: '#2c2c2c', shoeColor: '#1a1a1a', hairColor: '#2c1810' },
  'agent-builder':  { skinColor: '#d4a574', topColor: '#8b2020', trouserColor: '#2a2a3a', shoeColor: '#222222', hairColor: '#1a1008' },
  'agent-explorer': { skinColor: '#f0d0a0', topColor: '#1a6b3a', trouserColor: '#34495e', shoeColor: '#2a1a0a', hairColor: '#4a3020' },
  'agent-warrior':  { skinColor: '#c69c6d', topColor: '#5a2080', trouserColor: '#2c3e50', shoeColor: '#1a1a1a', hairColor: '#0a0a0a' },
};

const DEFAULT_APPEARANCE: AgentAppearance = {
  skinColor: '#e0b090',
  topColor: '#3a5a8a',
  trouserColor: '#2c2c2c',
  shoeColor: '#1a1a1a',
  hairColor: '#2c1810',
};

export function getAppearance(characterType: string): AgentAppearance {
  return APPEARANCES[characterType] || DEFAULT_APPEARANCE;
}
