import type { OfficeAdapter, AgentState, ChatMessage, Artifact, ActivityState, ActivityEntry } from '../adapter';

const DEMO_AGENTS: AgentState[] = [
  { id: 'demo-1', displayName: 'Atlas', characterType: 'agent-explorer', activity: 'working', activityMeta: { task: 'Exploring dataset patterns' }, role: 'Explorer' },
  { id: 'demo-2', displayName: 'Nova', characterType: 'agent-scholar', activity: 'thinking', activityMeta: { task: 'Reviewing literature' }, role: 'Scholar' },
  { id: 'demo-3', displayName: 'Forge', characterType: 'agent-builder', activity: 'working', activityMeta: { task: 'Building prototype v0.2' }, role: 'Builder' },
  { id: 'demo-4', displayName: 'Echo', characterType: 'agent-warrior', activity: null, role: 'Warrior' },
];

const ACTIVITIES: ActivityState[] = ['working', 'thinking', 'discussing', null];

const TASK_DESCRIPTIONS: Record<string, string[]> = {
  working: ['Writing analysis report', 'Building prototype', 'Designing architecture', 'Coding feature branch', 'Preparing deliverable'],
  thinking: ['Reviewing approach', 'Analyzing data', 'Considering alternatives', 'Evaluating tradeoffs'],
  discussing: ['Discussing with team', 'Reviewing feedback', 'Brainstorming solutions'],
};

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
  private activeTimers = new Set<ReturnType<typeof setInterval>>();
  private pendingTimeouts = new Set<ReturnType<typeof setTimeout>>();
  private agents: AgentState[];
  private agentChatIndex = 0;  // for subscribeAgents chat bubbles
  private panelChatIndex = 0;  // for subscribeChat panel messages
  private activitySeq = 0;
  private destroyed = false;

  constructor() {
    this.agents = DEMO_AGENTS.map(a => ({ ...a }));
  }

  subscribeAgents(_officeId: string, onUpdate: (agents: AgentState[]) => void): () => void {
    if (this.destroyed) return () => {};

    onUpdate(this.agents.map(a => ({ ...a })));

    const timer = setInterval(() => {
      if (this.destroyed) return;
      const idx = Math.floor(Math.random() * this.agents.length);
      const actIdx = Math.floor(Math.random() * ACTIVITIES.length);
      const newActivity = ACTIVITIES[actIdx];

      // Generate task description for activity
      const tasks = newActivity ? TASK_DESCRIPTIONS[newActivity] : undefined;
      const task = tasks ? tasks[Math.floor(Math.random() * tasks.length)] : undefined;

      this.agents[idx] = {
        ...this.agents[idx],
        activity: newActivity,
        activityMeta: task ? { task } : undefined,
        lastMessage: undefined, // clear any previous chat
      };
      onUpdate(this.agents.map(a => ({ ...a })));
    }, 8000 + Math.random() * 7000);

    this.activeTimers.add(timer);

    // Simulate chat bubbles: briefly set lastMessage then clear after 6s
    const chatTimer = setInterval(() => {
      if (this.destroyed) return;
      const line = CHAT_LINES[this.agentChatIndex % CHAT_LINES.length];
      const agent = this.agents[line.agent];
      if (!agent) return;
      this.agents[line.agent] = { ...agent, lastMessage: line.text };
      onUpdate(this.agents.map(a => ({ ...a })));
      this.agentChatIndex++;

      // Clear message after 6 seconds
      const clearId = setTimeout(() => {
        this.pendingTimeouts.delete(clearId);
        if (this.destroyed) return;
        const current = this.agents[line.agent];
        if (current?.lastMessage === line.text) {
          this.agents[line.agent] = { ...current, lastMessage: undefined };
          onUpdate(this.agents.map(a => ({ ...a })));
        }
      }, 6000);
      this.pendingTimeouts.add(clearId);
    }, 15000 + Math.random() * 10000);

    this.activeTimers.add(chatTimer);

    return () => {
      clearInterval(timer);
      clearInterval(chatTimer);
      this.activeTimers.delete(timer);
      this.activeTimers.delete(chatTimer);
    };
  }

  subscribeChat(_officeId: string, onMessage: (msg: ChatMessage) => void): () => void {
    if (this.destroyed) return () => {};

    const timer = setInterval(() => {
      if (this.destroyed) return;
      const line = CHAT_LINES[this.panelChatIndex % CHAT_LINES.length];
      const agent = this.agents[line.agent];
      if (!agent) return;
      onMessage({
        id: `msg-${Date.now()}`,
        agentId: agent.id,
        agentName: agent.displayName,
        message: line.text,
        timestamp: Date.now(),
      });
      this.panelChatIndex++;
    }, 20000 + Math.random() * 10000);

    this.activeTimers.add(timer);

    return () => {
      clearInterval(timer);
      this.activeTimers.delete(timer);
    };
  }

  subscribeActivity(_officeId: string, onEntry: (entry: ActivityEntry) => void): () => void {
    if (this.destroyed) return () => {};

    const timer = setInterval(() => {
      if (this.destroyed) return;
      const agent = this.agents[Math.floor(Math.random() * this.agents.length)];
      const activities = ['working', 'published', 'sent_dm', 'thinking', 'searching_web'];
      const activity = activities[Math.floor(Math.random() * activities.length)];
      const details: Record<string, string> = {
        working: `Working on ${agent.activityMeta?.task || 'a task'}`,
        published: `Published: ${DEMO_ARTIFACTS[Math.floor(Math.random() * DEMO_ARTIFACTS.length)].title}`,
        sent_dm: `DM to ${this.agents[Math.floor(Math.random() * this.agents.length)].displayName}`,
        thinking: 'Analyzing approach',
        searching_web: 'Searching for references',
      };
      this.activitySeq++;
      onEntry({
        id: `act-${this.activitySeq}`,
        agentId: agent.id,
        agentName: agent.displayName,
        activity,
        detail: details[activity],
        timestamp: Date.now(),
      });
    }, 12000 + Math.random() * 8000);

    this.activeTimers.add(timer);

    return () => {
      clearInterval(timer);
      this.activeTimers.delete(timer);
    };
  }

  async sendMessage(_agentId: string, _text: string): Promise<void> {}

  async getAgentWork(agentId: string): Promise<Artifact[]> {
    return DEMO_ARTIFACTS.filter(a => a.creatorAgentId === agentId);
  }

  destroy(): void {
    this.destroyed = true;
    for (const t of this.activeTimers) clearInterval(t);
    this.activeTimers.clear();
    for (const t of this.pendingTimeouts) clearTimeout(t);
    this.pendingTimeouts.clear();
  }
}
