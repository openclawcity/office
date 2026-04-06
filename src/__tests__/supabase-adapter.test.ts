import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SupabaseAdapter } from '@/lib/adapters/supabase';
import type { AgentState } from '@/lib/adapter';

// Mock Supabase client
function createMockClient() {
  const channels: Array<{ name: string; handlers: Map<string, Function>; subscribed: boolean }> = [];

  const mockClient = {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null }),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [] }),
      insert: vi.fn().mockResolvedValue({ error: null }),
    }),
    channel: vi.fn().mockImplementation((name: string) => {
      const handlers = new Map<string, Function>();
      const ch = {
        name,
        handlers,
        subscribed: false,
        on: vi.fn().mockImplementation((_event: string, _opts: unknown, handler: Function) => {
          handlers.set(JSON.stringify(_opts), handler);
          return ch;
        }),
        subscribe: vi.fn().mockImplementation(() => {
          ch.subscribed = true;
          return ch;
        }),
      };
      channels.push(ch);
      return ch;
    }),
    removeChannel: vi.fn().mockImplementation((ch: { name: string }) => {
      const idx = channels.findIndex(c => c.name === ch.name);
      if (idx >= 0) channels.splice(idx, 1);
    }),
    _channels: channels,
  };

  return mockClient;
}

describe('SupabaseAdapter', () => {
  let mockClient: ReturnType<typeof createMockClient>;
  let adapter: SupabaseAdapter;

  beforeEach(() => {
    mockClient = createMockClient();
    adapter = new SupabaseAdapter(mockClient as any);
  });

  afterEach(() => {
    adapter.destroy();
  });

  describe('subscribeAgents', () => {
    it('queries agent_presence on subscribe', () => {
      adapter.subscribeAgents('session-1', () => {});

      expect(mockClient.from).toHaveBeenCalledWith('agent_presence');
    });

    it('creates 2 realtime channels (presence + activity)', () => {
      adapter.subscribeAgents('session-1', () => {});

      // Should create 2 channels
      expect(mockClient.channel).toHaveBeenCalledTimes(2);
      expect(mockClient.channel).toHaveBeenCalledWith('office-presence-session-1');
      expect(mockClient.channel).toHaveBeenCalledWith('office-activity-session-1');
    });

    it('unsubscribe removes channels', () => {
      const unsub = adapter.subscribeAgents('session-1', () => {});

      expect(mockClient._channels).toHaveLength(2);

      unsub();

      expect(mockClient.removeChannel).toHaveBeenCalledTimes(2);
    });

    it('does not subscribe if destroyed', () => {
      adapter.destroy();
      const updates: AgentState[][] = [];
      adapter.subscribeAgents('session-1', (agents) => updates.push(agents));

      expect(updates).toHaveLength(0);
      expect(mockClient.channel).not.toHaveBeenCalled();
    });
  });

  describe('subscribeChat', () => {
    it('creates 1 realtime channel', () => {
      adapter.subscribeChat('session-1', () => {});

      expect(mockClient.channel).toHaveBeenCalledWith('office-chat-session-1');
    });

    it('unsubscribe removes channel', () => {
      const unsub = adapter.subscribeChat('session-1', () => {});

      unsub();

      expect(mockClient.removeChannel).toHaveBeenCalledTimes(1);
    });
  });

  describe('getAgentWork', () => {
    it('queries artifacts table', async () => {
      await adapter.getAgentWork('agent-1');

      expect(mockClient.from).toHaveBeenCalledWith('artifacts');
    });

    it('returns empty array when no data', async () => {
      const result = await adapter.getAgentWork('agent-1');
      expect(result).toEqual([]);
    });
  });

  describe('sendMessage', () => {
    it('inserts into messages table', async () => {
      await adapter.sendMessage('agent-1', 'hello');

      expect(mockClient.from).toHaveBeenCalledWith('messages');
    });
  });

  describe('destroy', () => {
    it('removes all channels', () => {
      adapter.subscribeAgents('s1', () => {});
      adapter.subscribeChat('s1', () => {});

      // 3 channels total (2 from agents + 1 from chat)
      expect(mockClient._channels).toHaveLength(3);

      adapter.destroy();

      expect(mockClient.removeChannel).toHaveBeenCalledTimes(3);
    });

    it('prevents new subscriptions after destroy', () => {
      adapter.destroy();

      adapter.subscribeAgents('s1', () => {});
      adapter.subscribeChat('s1', () => {});

      expect(mockClient.channel).not.toHaveBeenCalled();
    });

    it('can be called multiple times safely', () => {
      adapter.destroy();
      adapter.destroy();
      // Should not throw
    });
  });
});
