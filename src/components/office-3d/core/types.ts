export type ActivityState = 'working' | 'thinking' | 'discussing' | 'reviewing' | 'blocked' | null;

export interface AgentState {
  id: string;
  displayName: string;
  characterType: string;
  activity: ActivityState;
  role?: string;
}

export interface AgentAppearance {
  skinColor: string;
  topColor: string;
  trouserColor: string;
  shoeColor: string;
  hairColor: string;
}
