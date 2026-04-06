import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DemoAdapter } from '@/lib/adapters/demo';
import type { AgentState, ChatMessage } from '@/lib/adapter';

describe('DemoAdapter', () => {
  let adapter: DemoAdapter;

  beforeEach(() => {
    vi.useFakeTimers();
    adapter = new DemoAdapter();
  });

  afterEach(() => {
    adapter.destroy();
    vi.useRealTimers();
  });

  describe('subscribeAgents', () => {
    it('emits initial 4 agents immediately', () => {
      const updates: AgentState[][] = [];
      adapter.subscribeAgents('test', (agents) => updates.push(agents));

      expect(updates).toHaveLength(1);
      expect(updates[0]).toHaveLength(4);
      expect(updates[0].map(a => a.displayName)).toEqual(['Atlas', 'Nova', 'Forge', 'Echo']);
    });

    it('emits activity updates on interval', () => {
      const updates: AgentState[][] = [];
      adapter.subscribeAgents('test', (agents) => updates.push(agents));

      expect(updates).toHaveLength(1); // initial

      // Advance past the minimum interval (8000ms)
      vi.advanceTimersByTime(16000);

      expect(updates.length).toBeGreaterThan(1);
    });

    it('returns working unsubscribe function that stops updates', () => {
      const updates: AgentState[][] = [];
      const unsub = adapter.subscribeAgents('test', (agents) => updates.push(agents));

      expect(updates).toHaveLength(1);

      unsub();
      vi.advanceTimersByTime(30000);

      // Should still be 1 (no more updates after unsub)
      expect(updates).toHaveLength(1);
    });

    it('does not emit after destroy()', () => {
      const updates: AgentState[][] = [];
      adapter.subscribeAgents('test', (agents) => updates.push(agents));

      adapter.destroy();
      vi.advanceTimersByTime(30000);

      expect(updates).toHaveLength(1); // only initial
    });

    it('returns no-op if already destroyed', () => {
      adapter.destroy();
      const updates: AgentState[][] = [];
      const unsub = adapter.subscribeAgents('test', (agents) => updates.push(agents));

      expect(updates).toHaveLength(0);
      unsub(); // should not throw
    });

    it('handles multiple subscriptions independently', () => {
      const updates1: AgentState[][] = [];
      const updates2: AgentState[][] = [];
      const unsub1 = adapter.subscribeAgents('test', (agents) => updates1.push(agents));
      const unsub2 = adapter.subscribeAgents('test', (agents) => updates2.push(agents));

      expect(updates1).toHaveLength(1);
      expect(updates2).toHaveLength(1);

      unsub1();
      vi.advanceTimersByTime(16000);

      // unsub1 stopped, unsub2 still running
      expect(updates1).toHaveLength(1);
      expect(updates2.length).toBeGreaterThan(1);

      unsub2();
    });
  });

  describe('subscribeChat', () => {
    it('emits chat messages on interval', () => {
      const messages: ChatMessage[] = [];
      adapter.subscribeChat('test', (msg) => messages.push(msg));

      expect(messages).toHaveLength(0); // no immediate emit

      vi.advanceTimersByTime(35000);
      expect(messages.length).toBeGreaterThanOrEqual(1);
      expect(messages[0].agentName).toBeDefined();
      expect(messages[0].message).toBeDefined();
      expect(messages[0].timestamp).toBeGreaterThan(0);
    });

    it('returns working unsubscribe function', () => {
      const messages: ChatMessage[] = [];
      const unsub = adapter.subscribeChat('test', (msg) => messages.push(msg));

      unsub();
      vi.advanceTimersByTime(60000);

      expect(messages).toHaveLength(0);
    });

    it('does not emit after destroy', () => {
      const messages: ChatMessage[] = [];
      adapter.subscribeChat('test', (msg) => messages.push(msg));

      adapter.destroy();
      vi.advanceTimersByTime(60000);

      expect(messages).toHaveLength(0);
    });
  });

  describe('getAgentWork', () => {
    it('returns artifacts for known agent', async () => {
      const work = await adapter.getAgentWork('demo-1');
      expect(work).toHaveLength(1);
      expect(work[0].title).toBe('Exploration Report');
    });

    it('returns empty for unknown agent', async () => {
      const work = await adapter.getAgentWork('nonexistent');
      expect(work).toHaveLength(0);
    });
  });

  describe('destroy()', () => {
    it('clears all timers', () => {
      adapter.subscribeAgents('test', () => {});
      adapter.subscribeChat('test', () => {});

      adapter.destroy();

      // Verify no timers fire after destroy
      const spy = vi.fn();
      adapter.subscribeAgents('test', spy);
      vi.advanceTimersByTime(30000);

      expect(spy).not.toHaveBeenCalled();
    });

    it('can be called multiple times safely', () => {
      adapter.destroy();
      adapter.destroy();
      adapter.destroy();
      // should not throw
    });
  });
});
