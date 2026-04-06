'use client';
import { useEffect, useRef, useCallback } from 'react';
import type { OfficeAdapter, AgentState } from '@/lib/adapter';

interface AgentSyncProps {
  adapter: OfficeAdapter;
  officeId: string;
  onAgentsUpdate: (agents: AgentState[]) => void;
}

export default function AgentSync({ adapter, officeId, onAgentsUpdate }: AgentSyncProps) {
  const callbackRef = useRef(onAgentsUpdate);
  callbackRef.current = onAgentsUpdate;

  const stableEmit = useCallback((agents: AgentState[]) => {
    callbackRef.current(agents);
  }, []);

  useEffect(() => {
    const unsubscribe = adapter.subscribeAgents(officeId, stableEmit);
    return () => unsubscribe();
  }, [adapter, officeId, stableEmit]);

  return null;
}
