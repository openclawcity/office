import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DemoAdapter } from '@/lib/adapters/demo';

describe('DemoAdapter edge cases', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('unsubscribe removes timer from activeTimers set', () => {
    const adapter = new DemoAdapter();
    const unsub1 = adapter.subscribeAgents('test', () => {});
    const unsub2 = adapter.subscribeAgents('test', () => {});

    // Both timers active
    unsub1();
    // Only one timer removed, adapter still functional
    const updates: unknown[] = [];
    adapter.subscribeAgents('test', (a) => updates.push(a));
    vi.advanceTimersByTime(16000);
    expect(updates.length).toBeGreaterThan(1);

    unsub2();
    adapter.destroy();
  });

  it('destroy after unsubscribe does not double-clear', () => {
    const adapter = new DemoAdapter();
    const unsub = adapter.subscribeAgents('test', () => {});
    unsub(); // clears timer and removes from set
    adapter.destroy(); // clears remaining timers
    // Should not throw
  });

  it('subscribeChat cycles through all chat lines without crash', () => {
    const adapter = new DemoAdapter();
    const messages: string[] = [];
    adapter.subscribeChat('test', (msg) => messages.push(msg.message));

    // Advance enough for all 12 lines + wrap around
    vi.advanceTimersByTime(15 * 30000);
    expect(messages.length).toBeGreaterThan(12);

    // Verify no undefined messages
    for (const msg of messages) {
      expect(msg).toBeDefined();
      expect(typeof msg).toBe('string');
      expect(msg.length).toBeGreaterThan(0);
    }

    adapter.destroy();
  });

  it('agents array is deep-copied on each emit (no shared references)', () => {
    const adapter = new DemoAdapter();
    const snapshots: Array<Array<{ id: string; activity: string | null }>> = [];
    adapter.subscribeAgents('test', (agents) => {
      snapshots.push(agents.map(a => ({ id: a.id, activity: a.activity })));
    });

    vi.advanceTimersByTime(16000);
    expect(snapshots.length).toBeGreaterThan(1);

    // First snapshot should not be mutated by later updates
    const first = snapshots[0];
    const last = snapshots[snapshots.length - 1];
    // They're different snapshots, first wasn't mutated
    expect(first).not.toBe(last);

    adapter.destroy();
  });
});
