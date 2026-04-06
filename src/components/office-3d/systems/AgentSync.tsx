'use client';
import { useEffect, useRef, useCallback } from 'react';
import type { OfficeAdapter } from '@/lib/adapter';
import type { AgentState } from '../core/types';
import type { AgentState as AdapterAgentState } from '@/lib/adapter';

interface AgentSyncProps {
  adapter: OfficeAdapter;
  officeId: string;
  onAgentsUpdate: (agents: AgentState[]) => void;
}

/** Maps adapter AgentState to 3D AgentState (identical shape, but keeps types decoupled). */
function toInternalAgent(a: AdapterAgentState): AgentState {
  return {
    id: a.id,
    displayName: a.displayName,
    characterType: a.characterType,
    activity: a.activity,
    role: a.role,
  };
}

export default function AgentSync({ adapter, officeId, onAgentsUpdate }: AgentSyncProps) {
  const callbackRef = useRef(onAgentsUpdate);
  callbackRef.current = onAgentsUpdate;

  const stableEmit = useCallback((agents: AdapterAgentState[]) => {
    callbackRef.current(agents.map(toInternalAgent));
  }, []);

  useEffect(() => {
    const unsubscribe = adapter.subscribeAgents(officeId, stableEmit);
    return () => unsubscribe();
  }, [adapter, officeId, stableEmit]);

  return null;
}
