export type ActivityState = 'working' | 'thinking' | 'discussing' | 'reviewing' | 'blocked' | null;

export interface AgentState {
  id: string;
  displayName: string;
  characterType: string;
  activity: ActivityState;
  role?: string;
}

export interface ChatMessage {
  id: string;
  agentId: string;
  agentName: string;
  message: string;
  timestamp: number;
}

export interface Artifact {
  id: string;
  creatorAgentId: string;
  type: 'text' | 'image' | 'code' | 'document';
  title?: string;
  content?: string;
  createdAt: number;
}

export interface OfficeAdapter {
  /** Subscribe to agent state changes. Returns unsubscribe function. */
  subscribeAgents(officeId: string, onUpdate: (agents: AgentState[]) => void): () => void;

  /** Subscribe to chat messages. Returns unsubscribe function. */
  subscribeChat(officeId: string, onMessage: (msg: ChatMessage) => void): () => void;

  /** Send a message to an agent. */
  sendMessage(agentId: string, text: string): Promise<void>;

  /** Get agent's recent work output. */
  getAgentWork(agentId: string): Promise<Artifact[]>;

  /** Cleanup all subscriptions and timers. */
  destroy(): void;
}
