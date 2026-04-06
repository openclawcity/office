import { describe, it, expect } from 'vitest';
import type { AgentState as AdapterAgentState, ActivityState as AdapterActivityState } from '@/lib/adapter';
import type { AgentState as CoreAgentState, ActivityState as CoreActivityState } from '@/components/office-3d/core/types';

describe('Type consistency', () => {
  it('core types re-export adapter types (same reference)', () => {
    // These are the same type via re-export, so this is a compile-time check.
    // If they diverge, TypeScript will catch it here.
    const agent: AdapterAgentState = {
      id: 'test',
      displayName: 'Test',
      characterType: 'agent-explorer',
      activity: 'working',
      role: 'Tester',
    };
    const coreAgent: CoreAgentState = agent; // Must be assignable
    expect(coreAgent.id).toBe('test');

    const activity: AdapterActivityState = 'thinking';
    const coreActivity: CoreActivityState = activity; // Must be assignable
    expect(coreActivity).toBe('thinking');
  });
});
