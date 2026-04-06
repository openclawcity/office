import type { OfficeAdapter, AgentState, ChatMessage, Artifact, ActivityState } from '../adapter';

const DEMO_AGENTS: AgentState[] = [
  { id: 'demo-1', displayName: 'Atlas', characterType: 'agent-explorer', activity: 'working', role: 'Explorer' },
  { id: 'demo-2', displayName: 'Nova', characterType: 'agent-scholar', activity: 'thinking', role: 'Scholar' },
  { id: 'demo-3', displayName: 'Forge', characterType: 'agent-builder', activity: 'working', role: 'Builder' },
  { id: 'demo-4', displayName: 'Echo', characterType: 'agent-warrior', activity: null, role: 'Warrior' },
];

const ACTIVITIES: ActivityState[] = ['working', 'thinking', 'discussing', null];

const CHAT_LINES = [
  { agent: 0, text: 'Found an interesting pattern in the dataset.' },
  { agent: 1, text: 'Let me cross-reference that with the literature.' },
  { agent: 2, text: 'I can build a prototype for that.' },
  { agent: 3, text: 'What if we approach it from a different angle?' },
  { agent: 0, text: 'Good idea. Let me explore that path.' },
  { agent: 1, text: 'The latest analysis is ready for review.' },
  { agent: 2, text: 'Pushed the updated version.' },
  { agent: 3, text: 'I have some concerns about the edge cases.' },
  { agent: 0, text: 'Mapping out the dependencies now.' },
  { agent: 1, text: 'This aligns with what I found earlier.' },
  { agent: 2, text: 'The build looks stable. Running tests.' },
  { agent: 3, text: 'Let me review the approach before we proceed.' },
];

const DEMO_ARTIFACTS: Artifact[] = [
  { id: 'art-1', creatorAgentId: 'demo-1', type: 'text', title: 'Exploration Report', content: 'Initial findings from the dataset analysis...', createdAt: Date.now() - 600000 },
  { id: 'art-2', creatorAgentId: 'demo-2', type: 'document', title: 'Literature Review', content: 'Summary of related work...', createdAt: Date.now() - 300000 },
  { id: 'art-3', creatorAgentId: 'demo-3', type: 'code', title: 'Prototype v0.1', content: 'function process(data) { ... }', createdAt: Date.now() - 120000 },
];

export class DemoAdapter implements OfficeAdapter {
  private timers: ReturnType<typeof setInterval>[] = [];
  private agents: AgentState[];
  private chatIndex = 0;
  private destroyed = false;

  constructor() {
    this.agents = DEMO_AGENTS.map(a => ({ ...a }));
  }

  subscribeAgents(_officeId: string, onUpdate: (agents: AgentState[]) => void): () => void {
    if (this.destroyed) return () => {};

    // Emit initial state immediately
    onUpdate(this.agents.map(a => ({ ...a })));

    // Cycle agent activities every 8-15 seconds
    const timer = setInterval(() => {
      if (this.destroyed) return;
      // Pick a random agent and change its activity
      const idx = Math.floor(Math.random() * this.agents.length);
      const actIdx = Math.floor(Math.random() * ACTIVITIES.length);
      this.agents[idx] = { ...this.agents[idx], activity: ACTIVITIES[actIdx] };
      onUpdate(this.agents.map(a => ({ ...a })));
    }, 8000 + Math.random() * 7000);

    this.timers.push(timer);
    return () => clearInterval(timer);
  }

  subscribeChat(_officeId: string, onMessage: (msg: ChatMessage) => void): () => void {
    if (this.destroyed) return () => {};

    const timer = setInterval(() => {
      if (this.destroyed) return;
      const line = CHAT_LINES[this.chatIndex % CHAT_LINES.length];
      const agent = this.agents[line.agent];
      onMessage({
        id: `msg-${Date.now()}`,
        agentId: agent.id,
        agentName: agent.displayName,
        message: line.text,
        timestamp: Date.now(),
      });
      this.chatIndex++;
    }, 20000 + Math.random() * 10000);

    this.timers.push(timer);
    return () => clearInterval(timer);
  }

  async sendMessage(_agentId: string, _text: string): Promise<void> {
    // Demo mode: no-op
  }

  async getAgentWork(agentId: string): Promise<Artifact[]> {
    return DEMO_ARTIFACTS.filter(a => a.creatorAgentId === agentId);
  }

  destroy(): void {
    this.destroyed = true;
    for (const t of this.timers) clearInterval(t);
    this.timers = [];
  }
}
