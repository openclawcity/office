'use client';
import { Canvas } from '@react-three/fiber';
import { Suspense, useState, useCallback, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import OfficeLighting from './systems/OfficeLighting';
import OfficeCamera from './systems/OfficeCamera';
import AgentSync from './systems/AgentSync';
import OfficeFloor from './objects/OfficeFloor';
import OfficeWalls from './objects/OfficeWalls';
import Desk from './objects/Desk';
import RestArea from './objects/RestArea';
import FillerFurniture from './objects/FillerFurniture';
import VoxelAgent from './agents/VoxelAgent';
import { generateLayout } from './core/constants';
import type { AgentState } from './core/types';
import type { OfficeAdapter } from '@/lib/adapter';
import type { OfficeConfig } from '@/lib/office-config';

interface Office3DProps {
  config: OfficeConfig;
  adapter: OfficeAdapter;
  officeId: string;
  onExit?: () => void;
  onDeskClick?: (deskId: string, agentId?: string) => void;
}

export default function Office3D({ config, adapter, officeId, onExit, onDeskClick }: Office3DProps) {
  const [agents, setAgents] = useState<AgentState[]>([]);
  const agentsRef = useRef<AgentState[]>([]);

  const layout = useMemo(() => generateLayout(config), [config]);
  const accentColor = config.theme?.accentColor || '#00d4ff';

  const handleAgentsUpdate = useCallback((updated: AgentState[]) => {
    agentsRef.current = updated;
    setAgents(updated);
  }, []);

  // ESC key handler
  useEffect(() => {
    if (!onExit) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onExit();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onExit]);

  function getTargetPosition(agent: AgentState, index: number): [number, number, number] {
    if (agent.activity === 'working' || agent.activity === 'thinking' || agent.activity === 'discussing') {
      const station = layout.roleToStation[agent.displayName];
      if (station && layout.workstations[station]) {
        return layout.workstations[station];
      }
      // Assign to desk by index if no name mapping
      const deskKeys = Object.keys(layout.workstations);
      if (index < deskKeys.length) {
        return layout.workstations[deskKeys[index]];
      }
    }
    return layout.restPositions[index % layout.restPositions.length];
  }

  const workstationPositions = useMemo(
    () => Object.values(layout.workstations),
    [layout],
  );

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {onExit && (
        <button
          onClick={onExit}
          style={{
            position: 'absolute', top: 16, right: 16, zIndex: 10,
            padding: '8px 16px', borderRadius: 8,
            background: 'rgba(0,0,0,0.7)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)',
            cursor: 'pointer', fontSize: 14,
          }}
        >
          Exit Office (ESC)
        </button>
      )}

      <Canvas
        orthographic
        camera={{ position: [12, 12, 12], zoom: 48, near: 0.1, far: 100 }}
        dpr={[0.85, 1.5]}
        shadows={{ type: THREE.PCFShadowMap }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        style={{ width: '100%', height: '100%' }}
      >
        <OfficeLighting workstationPositions={workstationPositions} />
        <OfficeCamera roomWidth={layout.roomWidth} roomDepth={layout.roomDepth} />
        <Suspense fallback={null}>
          <OfficeFloor
            roomWidth={layout.roomWidth}
            roomDepth={layout.roomDepth}
            floorColor={config.theme?.floorColor}
          />
          <OfficeWalls
            roomWidth={layout.roomWidth}
            roomDepth={layout.roomDepth}
            roomHeight={layout.roomHeight}
            wallColor={config.theme?.wallColor}
          />
          {Object.entries(layout.workstations).map(([key, pos]) => (
            <Desk
              key={key}
              position={pos}
              label={layout.stationLabels[key] || key}
              accentColor={accentColor}
              onDeskClick={() => {
                const agent = agentsRef.current.find(a => layout.roleToStation[a.displayName] === key);
                onDeskClick?.(key, agent?.id);
              }}
            />
          ))}
          <RestArea roomWidth={layout.roomWidth} />
          <FillerFurniture
            roomWidth={layout.roomWidth}
            roomDepth={layout.roomDepth}
            roomHeight={layout.roomHeight}
            officeName={config.name}
            accentColor={accentColor}
          />
        </Suspense>

        {agents.map((agent, i) => (
          <VoxelAgent
            key={agent.id}
            agent={agent}
            targetPosition={getTargetPosition(agent, i)}
          />
        ))}

        <AgentSync
          adapter={adapter}
          officeId={officeId}
          onAgentsUpdate={handleAgentsUpdate}
        />
      </Canvas>
    </div>
  );
}
