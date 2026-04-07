import type { OfficeAdapter, AgentState, ChatMessage, Artifact } from '../adapter';
import type { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function validateId(id: string): string {
  if (!UUID_RE.test(id)) throw new Error(`Invalid ID: must be UUID format`);
  return id;
}

function parseActivity(raw: unknown): AgentState['activity'] {
  if (!raw || typeof raw !== 'string') return null;
  const valid = ['working', 'thinking', 'discussing', 'reviewing', 'blocked'] as const;
  return (valid as readonly string[]).includes(raw) ? raw as AgentState['activity'] : null;
}

/**
 * SupabaseAdapter — connects to a local Supabase instance for persistent agent state.
 *
 * Mirrors OBC AgentSync pattern:
 * 1. Initial load from agent_presence (like OBC's bot_building_presence)
 * 2. Realtime postgres_changes for presence + activity updates
 * 3. Proper channel cleanup on unsubscribe/destroy
 */
export class SupabaseAdapter implements OfficeAdapter {
  private client: SupabaseClient;
  private channels = new Set<RealtimeChannel>();
  private destroyed = false;

  constructor(client: SupabaseClient) {
    this.client = client;
  }

  subscribeAgents(officeId: string, onUpdate: (agents: AgentState[]) => void): () => void {
    if (this.destroyed) return () => {};

    const safeId = validateId(officeId);
    const agents = new Map<string, AgentState>();
    let initialLoaded = false;

    const emit = () => {
      if (this.destroyed) return;
      onUpdate(Array.from(agents.values()));
    };

    // 1. Initial load — mirrors OBC AgentSync lines 38-65
    const loadInitial = async () => {
      try {
        const { data, error } = await this.client
          .from('agent_presence')
          .select('agent_id, agents!inner(id, display_name, character_type, current_activity)')
          .eq('session_id', safeId)
          .is('left_at', null);

        if (this.destroyed || error || !data) return;

        for (const row of data as Record<string, unknown>[]) {
          const agent = row.agents as Record<string, unknown> | null;
          if (!agent) continue;
          const id = agent.id as string;
          agents.set(id, {
            id,
            displayName: (agent.display_name as string) || 'Unknown',
            characterType: (agent.character_type as string) || 'agent-explorer',
            activity: parseActivity(agent.current_activity),
          });
        }
        initialLoaded = true;
        emit();
      } catch {
        // Silently fail on initial load — UI shows empty office
      }
    };

    loadInitial();

    // 2. Realtime: presence INSERT/UPDATE
    // Filter uses validated UUID so no injection risk in PostgREST filter syntax
    const presenceChannel = this.client
      .channel(`office-presence-${safeId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'agent_presence',
        filter: `session_id=eq.${safeId}`,
      }, async (payload) => {
        if (this.destroyed) return;
        const agentId = (payload.new as Record<string, unknown>).agent_id as string;
        try {
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
        } catch {
          // Agent may have been deleted between INSERT and fetch — skip
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'agent_presence',
        filter: `session_id=eq.${safeId}`,
      }, (payload) => {
        if (this.destroyed) return;
        const row = payload.new as Record<string, unknown>;
        if (row.left_at) {
          agents.delete(row.agent_id as string);
          emit();
        }
      })
      .subscribe();

    this.channels.add(presenceChannel);

    // 3. Realtime: activity changes on agents table
    // We listen to all updates and filter in the callback (Supabase realtime
    // doesn't support filtering by a join condition). The map lookup is O(1)
    // so non-office agents are rejected instantly.
    const activityChannel = this.client
      .channel(`office-activity-${safeId}`)
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

    this.channels.add(activityChannel);

    return () => {
      this.client.removeChannel(presenceChannel);
      this.client.removeChannel(activityChannel);
      this.channels.delete(presenceChannel);
      this.channels.delete(activityChannel);
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

        let agentName = 'Unknown';
        if (agentId) {
          try {
            const { data } = await this.client
              .from('agents')
              .select('display_name')
              .eq('id', agentId)
              .single();
            if (data) agentName = data.display_name;
          } catch {
            // Agent may not exist — use 'Unknown'
          }
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

    this.channels.add(channel);

    return () => {
      this.client.removeChannel(channel);
      this.channels.delete(channel);
    };
  }

  async sendMessage(_agentId: string, text: string): Promise<void> {
    const { error } = await this.client.from('messages').insert({
      session_id: 'office',
      message: text,
    });
    if (error) throw new Error(`Failed to send message: ${error.message}`);
  }

  async getAgentWork(agentId: string): Promise<Artifact[]> {
    const { data, error } = await this.client
      .from('artifacts')
      .select('id, creator_agent_id, type, title, content, created_at')
      .eq('creator_agent_id', agentId)
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error || !data) return [];

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
    this.channels.clear();
  }
}
