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
import { generateLayout, WANDER_POINTS, WANDER_PERSONALITIES } from './core/constants';
import type { OfficeAdapter, AgentState } from '@/lib/adapter';
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
  const [selectedAgent, setSelectedAgent] = useState<AgentState | null>(null);
  const [wanderIndices, setWanderIndices] = useState<number[]>(() =>
    Array.from({ length: 12 }, (_, i) => i % WANDER_POINTS.length)
  );

  const layout = useMemo(() => generateLayout(config), [config]);
  const accentColor = config.theme?.accentColor || '#00d4ff';

  // Activity overrides: force 'working' for 3 min after interaction
  const activityOverrides = useRef<Map<string, number>>(new Map());

  const handleAgentsUpdate = useCallback((updated: AgentState[]) => {
    const now = Date.now();
    const withOverrides = updated.map(a => {
      const expires = activityOverrides.current.get(a.id);
      if (expires) {
        if (now > expires) {
          activityOverrides.current.delete(a.id);
          return a;
        }
        if (a.activity === 'working' || a.activity === 'thinking') {
          activityOverrides.current.delete(a.id);
          return a;
        }
        return { ...a, activity: 'working' as const };
      }
      return a;
    });
    agentsRef.current = withOverrides;
    setAgents(withOverrides);
  }, []);

  const forceWorking = useCallback((botId: string) => {
    activityOverrides.current.set(botId, Date.now() + 180000);
    setAgents(prev => prev.map(a =>
      a.id === botId ? { ...a, activity: 'working' as const } : a
    ));
  }, []);

  // Wander scheduler for idle agents
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    function scheduleWander(agentIdx: number) {
      const p = WANDER_PERSONALITIES[agentIdx % WANDER_PERSONALITIES.length];
      const delay = p.minDelay + Math.random() * (p.maxDelay - p.minDelay);
      const tid = setTimeout(() => {
        setWanderIndices(prev => {
          const next = [...prev];
          let newIdx = Math.floor(Math.random() * WANDER_POINTS.length);
          while (newIdx === prev[agentIdx] && WANDER_POINTS.length > 1) {
            newIdx = Math.floor(Math.random() * WANDER_POINTS.length);
          }
          next[agentIdx] = newIdx;
          return next;
        });
        scheduleWander(agentIdx);
      }, delay);
      timers.push(tid);
    }
    const maxAgents = Math.min(config.desks.length || 4, 12);
    for (let i = 0; i < maxAgents; i++) {
      const p = WANDER_PERSONALITIES[i % WANDER_PERSONALITIES.length];
      const tid = setTimeout(() => scheduleWander(i), p.initialDelay + Math.random() * 3000);
      timers.push(tid);
    }
    return () => timers.forEach(clearTimeout);
  }, [config.desks.length]);

  // ESC key handler: close panel first, then exit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedAgent) {
          setSelectedAgent(null);
        } else if (onExit) {
          onExit();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onExit, selectedAgent]);

  // Ambient office audio
  useEffect(() => {
    let ctx: AudioContext | null = null;
    let started = false;

    function startAmbience() {
      if (started) return;
      started = true;
      try {
        ctx = new AudioContext();
        const bufferSize = ctx.sampleRate * 2;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.015;
        const noise = ctx.createBufferSource();
        noise.buffer = noiseBuffer;
        noise.loop = true;
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 200;
        const gain = ctx.createGain();
        gain.gain.value = 0.3;
        noise.connect(filter).connect(gain).connect(ctx.destination);
        noise.start();
      } catch { /* audio not supported */ }
    }

    const handler = () => { startAmbience(); document.removeEventListener('click', handler); };
    document.addEventListener('click', handler);

    return () => {
      document.removeEventListener('click', handler);
      if (ctx) ctx.close().catch(() => {});
    };
  }, []);

  const deskKeys = useMemo(() => Object.keys(layout.workstations), [layout]);

  const getTargetPosition = useCallback((agent: AgentState, index: number): [number, number, number] => {
    if (agent.activity === 'working' || agent.activity === 'thinking' || agent.activity === 'discussing') {
      const station = layout.roleToStation[agent.displayName];
      if (station && layout.seatPositions[station]) {
        return layout.seatPositions[station];
      }
      if (index < deskKeys.length && layout.seatPositions[deskKeys[index]]) {
        return layout.seatPositions[deskKeys[index]];
      }
    }
    // Idle: use wander points
    const wi = wanderIndices[index] ?? 0;
    return WANDER_POINTS[wi % WANDER_POINTS.length];
  }, [layout, deskKeys, wanderIndices]);

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
          <OfficeFloor roomWidth={layout.roomWidth} roomDepth={layout.roomDepth} floorColor={config.theme?.floorColor} />
          <OfficeWalls roomWidth={layout.roomWidth} roomDepth={layout.roomDepth} roomHeight={layout.roomHeight} wallColor={config.theme?.wallColor} />
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
          <FillerFurniture roomWidth={layout.roomWidth} roomDepth={layout.roomDepth} roomHeight={layout.roomHeight} officeName={config.name} accentColor={accentColor} />
        </Suspense>

        {agents.map((agent, i) => (
          <VoxelAgent
            key={agent.id}
            agent={agent}
            targetPosition={getTargetPosition(agent, i)}
            onAgentClick={(a) => setSelectedAgent(a)}
          />
        ))}

        <AgentSync adapter={adapter} officeId={officeId} onAgentsUpdate={handleAgentsUpdate} />
      </Canvas>

      {/* Agent selection panel */}
      {selectedAgent && (
        <div
          style={{ position: 'absolute', top: 80, right: 20, zIndex: 20, width: 300 }}
          className="rounded-2xl border border-white/10 bg-gray-950/95 backdrop-blur-xl p-5 shadow-2xl text-white"
        >
          <button
            onClick={() => setSelectedAgent(null)}
            className="absolute top-3 right-3 text-gray-500 hover:text-white transition"
            aria-label="Close agent panel"
          >
            &times;
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold">
              {selectedAgent.displayName.charAt(0)}
            </div>
            <div>
              <h3 className="font-semibold text-sm">{selectedAgent.displayName}</h3>
              <p className="text-xs text-gray-400">{selectedAgent.role || 'Agent'}</p>
            </div>
          </div>

          <div className="mb-3">
            <div className="flex items-center gap-2 text-xs">
              <span className={`w-2 h-2 rounded-full ${selectedAgent.activity === 'working' ? 'bg-amber-400 animate-pulse' : selectedAgent.activity === 'thinking' ? 'bg-blue-400 animate-pulse' : 'bg-gray-500'}`} />
              <span className="text-gray-300">
                {selectedAgent.activity
                  ? `${selectedAgent.activity.charAt(0).toUpperCase() + selectedAgent.activity.slice(1)}${selectedAgent.activityMeta?.task ? `: ${selectedAgent.activityMeta.task}` : ''}`
                  : 'Idle'}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                forceWorking(selectedAgent.id);
                onDeskClick?.(selectedAgent.role || '', selectedAgent.id);
                setSelectedAgent(null);
              }}
              className="flex-1 px-3 py-2 text-xs font-medium rounded-lg bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/20 transition text-center cursor-pointer"
            >
              View Work
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
