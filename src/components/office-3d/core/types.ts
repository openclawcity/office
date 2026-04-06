// Re-export from the canonical adapter types to avoid duplication
export type { AgentState, ActivityState } from '@/lib/adapter';

export interface AgentAppearance {
  skinColor: string;
  topColor: string;
  trouserColor: string;
  shoeColor: string;
  hairColor: string;
}
