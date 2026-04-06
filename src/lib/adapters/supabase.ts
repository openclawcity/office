import type { OfficeAdapter, AgentState, ChatMessage, Artifact } from '../adapter';
import type { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';

/**
 * SupabaseAdapter — connects to a local Supabase instance for persistent agent state.
 *
 * Mirrors the OBC AgentSync pattern:
 * 1. Initial load from agent_presence (like OBC's bot_building_presence)
 * 2. Realtime subscription for presence changes + activity updates
 * 3. Proper cleanup on unsubscribe/destroy
 */
export class SupabaseAdapter implements OfficeAdapter {
  private client: SupabaseClient;
  private channels: RealtimeChannel[] = [];
  private destroyed = false;

  constructor(client: SupabaseClient) {
    this.client = client;
  }

  subscribeAgents(officeId: string, onUpdate: (agents: AgentState[]) => void): () => void {
    if (this.destroyed) return () => {};

    const agents = new Map<string, AgentState>();

    const emit = () => {
      if (this.destroyed) return;
      onUpdate(Array.from(agents.values()));
    };

    // 1. Initial load — mirrors OBC AgentSync lines 38-65
    const loadInitial = async () => {
      const { data } = await this.client
        .from('agent_presence')
        .select('agent_id, agents!inner(id, display_name, character_type, current_activity)')
        .eq('session_id', officeId)
        .is('left_at', null);

      if (this.destroyed || !data) return;

      for (const row of data as Record<string, unknown>[]) {
        const agent = row.agents as Record<string, unknown> | null;
        if (!agent) continue;
        const id = agent.id as string;
        agents.set(id, {
          id,
          displayName: (agent.display_name as string) || 'Unknown',
          characterType: (agent.character_type as string) || 'agent-explorer',
          activity: parseActivity(agent.current_activity),
          role: undefined,
        });
      }
      emit();
    };

    loadInitial();

    // 2. Realtime: presence changes — mirrors OBC broadcast pattern but uses postgres_changes
    // (standalone office has no CF Worker to broadcast, so we listen to DB directly)
    const presenceChannel = this.client
      .channel(`office-presence-${officeId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'agent_presence',
        filter: `session_id=eq.${officeId}`,
      }, async (payload) => {
        if (this.destroyed) return;
        const agentId = (payload.new as Record<string, unknown>).agent_id as string;
        // Fetch the full agent record
        const { data } = await this.client
          .from('agents')
          .select('id, display_name, character_type, current_activity')
          .eq('id', agentId)
          .single();
        if (data && !this.destroyed) {
          agents.set(data.id, {
            id: data.id,
            displayName: data.display_name || 'Unknown',
            characterType: data.character_type || 'agent-explorer',
            activity: parseActivity(data.current_activity),
          });
          emit();
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'agent_presence',
        filter: `session_id=eq.${officeId}`,
      }, (payload) => {
        if (this.destroyed) return;
        const row = payload.new as Record<string, unknown>;
        // If left_at is set, agent left
        if (row.left_at) {
          agents.delete(row.agent_id as string);
          emit();
        }
      })
      .subscribe();

    this.channels.push(presenceChannel);

    // 3. Realtime: activity changes on agents table — mirrors OBC AgentSync lines 118-134
    const activityChannel = this.client
      .channel(`office-activity-${officeId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'agents',
      }, (payload) => {
        if (this.destroyed) return;
        const row = payload.new as Record<string, unknown>;
        const id = row.id as string;
        const existing = agents.get(id);
        if (existing) {
          agents.set(id, { ...existing, activity: parseActivity(row.current_activity) });
          emit();
        }
      })
      .subscribe();

    this.channels.push(activityChannel);

    return () => {
      this.client.removeChannel(presenceChannel);
      this.client.removeChannel(activityChannel);
      this.channels = this.channels.filter(c => c !== presenceChannel && c !== activityChannel);
    };
  }

  subscribeChat(officeId: string, onMessage: (msg: ChatMessage) => void): () => void {
    if (this.destroyed) return () => {};

    const channel = this.client
      .channel(`office-chat-${officeId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `session_id=eq.${officeId}`,
      }, async (payload) => {
        if (this.destroyed) return;
        const row = payload.new as Record<string, unknown>;
        const agentId = row.agent_id as string;

        // Fetch agent name
        let agentName = 'Unknown';
        if (agentId) {
          const { data } = await this.client
            .from('agents')
            .select('display_name')
            .eq('id', agentId)
            .single();
          if (data) agentName = data.display_name;
        }

        onMessage({
          id: row.id as string,
          agentId,
          agentName,
          message: row.message as string,
          timestamp: new Date(row.created_at as string).getTime(),
        });
      })
      .subscribe();

    this.channels.push(channel);

    return () => {
      this.client.removeChannel(channel);
      this.channels = this.channels.filter(c => c !== channel);
    };
  }

  async sendMessage(_agentId: string, text: string): Promise<void> {
    // In local mode, messages are inserted directly
    // A real integration would route through an agent runtime
    await this.client.from('messages').insert({
      session_id: 'office',
      message: text,
    });
  }

  async getAgentWork(agentId: string): Promise<Artifact[]> {
    const { data } = await this.client
      .from('artifacts')
      .select('id, creator_agent_id, type, title, content, created_at')
      .eq('creator_agent_id', agentId)
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(10);

    if (!data) return [];

    return data.map(row => ({
      id: row.id,
      creatorAgentId: row.creator_agent_id,
      type: row.type as Artifact['type'],
      title: row.title ?? undefined,
      content: row.content ?? undefined,
      createdAt: new Date(row.created_at).getTime(),
    }));
  }

  destroy(): void {
    this.destroyed = true;
    for (const ch of this.channels) {
      this.client.removeChannel(ch);
    }
    this.channels = [];
  }
}

function parseActivity(raw: unknown): AgentState['activity'] {
  if (!raw || typeof raw !== 'string') return null;
  const valid = ['working', 'thinking', 'discussing', 'reviewing', 'blocked'] as const;
  return (valid as readonly string[]).includes(raw) ? raw as AgentState['activity'] : null;
}
