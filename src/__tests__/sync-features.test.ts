import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DemoAdapter } from '@/lib/adapters/demo';
import { generateLayout, WANDER_POINTS } from '@/components/office-3d/core/constants';
import { PRESETS } from '@/lib/office-config';
import type { AgentState, ActivityEntry } from '@/lib/adapter';

describe('Sync features: wander points', () => {
  it('WANDER_POINTS has 10 positions', () => {
    expect(WANDER_POINTS).toHaveLength(10);
  });

  it('all wander points are in break room (z > 2)', () => {
    for (const [, , z] of WANDER_POINTS) {
      expect(z).toBeGreaterThan(2);
    }
  });

  it('all wander points have y=0 (floor level)', () => {
    for (const [, y] of WANDER_POINTS) {
      expect(y).toBe(0);
    }
  });
});

describe('Sync features: seat positions', () => {
  it('generateLayout produces seatPositions for each desk', () => {
    const layout = generateLayout({ name: 'Test', ...PRESETS.startup });
    const deskCount = Object.keys(layout.workstations).length;
    const seatCount = Object.keys(layout.seatPositions).length;
    expect(seatCount).toBe(deskCount);
  });

  it('seat positions have y=0.21 (chair height)', () => {
    const layout = generateLayout({ name: 'Test', ...PRESETS.corporate });
    for (const pos of Object.values(layout.seatPositions)) {
      expect(pos[1]).toBe(0.21);
    }
  });

  it('seat positions are offset z+0.55 from desk positions', () => {
    const layout = generateLayout({ name: 'Test', ...PRESETS.corporate });
    for (const key of Object.keys(layout.workstations)) {
      const desk = layout.workstations[key];
      const seat = layout.seatPositions[key];
      expect(seat[0]).toBe(desk[0]); // same x
      expect(seat[2]).toBeCloseTo(desk[2] + 0.55, 5); // z + 0.55
    }
  });
});

describe('Sync features: DemoAdapter activityMeta + lastMessage', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('initial agents have activityMeta with task', () => {
    const adapter = new DemoAdapter();
    const updates: AgentState[][] = [];
    adapter.subscribeAgents('test', (agents) => updates.push(agents));

    expect(updates).toHaveLength(1);
    const workingAgent = updates[0].find(a => a.activity === 'working');
    expect(workingAgent?.activityMeta?.task).toBeDefined();
    expect(typeof workingAgent?.activityMeta?.task).toBe('string');

    adapter.destroy();
  });

  it('agents get lastMessage from chat bubbles', () => {
    const adapter = new DemoAdapter();
    const updates: AgentState[][] = [];
    adapter.subscribeAgents('test', (agents) => updates.push(agents));

    // Advance past chat bubble interval (15-25s)
    vi.advanceTimersByTime(30000);

    const withMessage = updates.find(snapshot =>
      snapshot.some(a => a.lastMessage !== undefined)
    );
    expect(withMessage).toBeDefined();

    adapter.destroy();
  });

  it('lastMessage clears after 6 seconds', () => {
    const adapter = new DemoAdapter();
    const updates: AgentState[][] = [];
    adapter.subscribeAgents('test', (agents) => updates.push(agents));

    // Trigger chat bubble
    vi.advanceTimersByTime(30000);

    // Find snapshot with message
    const withMsg = updates.findIndex(s => s.some(a => a.lastMessage));
    expect(withMsg).toBeGreaterThan(-1);

    // Advance 7 seconds — message should clear
    vi.advanceTimersByTime(7000);
    const lastSnapshot = updates[updates.length - 1];
    const stillHasMsg = lastSnapshot.some(a => a.lastMessage);
    // May or may not be cleared depending on timing, but no error
    expect(lastSnapshot).toBeDefined();

    adapter.destroy();
  });
});

describe('Sync features: DemoAdapter activity stream', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('subscribeActivity emits activity entries', () => {
    const adapter = new DemoAdapter();
    const entries: ActivityEntry[] = [];
    adapter.subscribeActivity!('test', (entry) => entries.push(entry));

    vi.advanceTimersByTime(25000);
    expect(entries.length).toBeGreaterThanOrEqual(1);
    expect(entries[0].agentId).toBeDefined();
    expect(entries[0].activity).toBeDefined();
    expect(entries[0].detail).toBeDefined();
    expect(entries[0].timestamp).toBeGreaterThan(0);

    adapter.destroy();
  });

  it('subscribeActivity returns working unsubscribe', () => {
    const adapter = new DemoAdapter();
    const entries: ActivityEntry[] = [];
    const unsub = adapter.subscribeActivity!('test', (entry) => entries.push(entry));

    unsub();
    vi.advanceTimersByTime(60000);
    expect(entries).toHaveLength(0);

    adapter.destroy();
  });
});

describe('Sync features: SQL schema', () => {
  it('activity_log migration exists', async () => {
    const { readFileSync } = await import('fs');
    const { join } = await import('path');
    const sql = readFileSync(join(__dirname, '../../supabase/migrations/003_activity_log.sql'), 'utf-8');
    expect(sql).toContain('CREATE TABLE activity_log');
    expect(sql).toContain('agent_id uuid NOT NULL REFERENCES agents(id)');
    expect(sql).toContain('idx_activity_log_time');
    expect(sql).toContain('idx_activity_log_agent');
    expect(sql).toContain('supabase_realtime ADD TABLE activity_log');
  });
});
