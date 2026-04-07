import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SupabaseAdapter } from '@/lib/adapters/supabase';
import type { AgentState } from '@/lib/adapter';

function createMockClient() {
  const channels: Array<{ name: string; handlers: Map<string, Function>; subscribed: boolean }> = [];

  const mockClient = {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
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

const VALID_UUID = '12345678-1234-1234-1234-123456789abc';

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
      adapter.subscribeAgents(VALID_UUID, () => {});
      expect(mockClient.from).toHaveBeenCalledWith('agent_presence');
    });

    it('creates 2 realtime channels (presence + activity)', () => {
      adapter.subscribeAgents(VALID_UUID, () => {});
      expect(mockClient.channel).toHaveBeenCalledTimes(2);
      expect(mockClient.channel).toHaveBeenCalledWith(`office-presence-${VALID_UUID}`);
      expect(mockClient.channel).toHaveBeenCalledWith(`office-activity-${VALID_UUID}`);
    });

    it('unsubscribe removes channels', () => {
      const unsub = adapter.subscribeAgents(VALID_UUID, () => {});
      expect(mockClient._channels).toHaveLength(2);
      unsub();
      expect(mockClient.removeChannel).toHaveBeenCalledTimes(2);
    });

    it('does not subscribe if destroyed', () => {
      adapter.destroy();
      const updates: AgentState[][] = [];
      adapter.subscribeAgents(VALID_UUID, (agents) => updates.push(agents));
      expect(updates).toHaveLength(0);
      expect(mockClient.channel).not.toHaveBeenCalled();
    });

    it('throws on invalid officeId (non-UUID)', () => {
      expect(() => {
        adapter.subscribeAgents('not-a-uuid', () => {});
      }).toThrow('Invalid ID: must be UUID format');
    });

    it('throws on officeId with injection attempt', () => {
      expect(() => {
        adapter.subscribeAgents('eq.true);"attack', () => {});
      }).toThrow('Invalid ID: must be UUID format');
    });

    it('accepts valid UUID formats', () => {
      expect(() => {
        adapter.subscribeAgents('00000000-0000-0000-0000-000000000000', () => {});
      }).not.toThrow();
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

  describe('sendMessage', () => {
    it('inserts into messages table', async () => {
      await adapter.sendMessage('agent-1', 'hello');
      expect(mockClient.from).toHaveBeenCalledWith('messages');
    });

    it('throws on insert error', async () => {
      mockClient.from.mockReturnValueOnce({
        insert: vi.fn().mockResolvedValue({ error: { message: 'DB error' } }),
      });
      await expect(adapter.sendMessage('agent-1', 'hello')).rejects.toThrow('Failed to send message');
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

  describe('destroy', () => {
    it('removes all channels', () => {
      adapter.subscribeAgents(VALID_UUID, () => {});
      adapter.subscribeChat('s1', () => {});
      expect(mockClient._channels).toHaveLength(3);
      adapter.destroy();
      expect(mockClient.removeChannel).toHaveBeenCalledTimes(3);
    });

    it('prevents new subscriptions after destroy', () => {
      adapter.destroy();
      adapter.subscribeAgents(VALID_UUID, () => {});
      adapter.subscribeChat('s1', () => {});
      expect(mockClient.channel).not.toHaveBeenCalled();
    });

    it('can be called multiple times safely', () => {
      adapter.destroy();
      adapter.destroy();
    });
  });
});
