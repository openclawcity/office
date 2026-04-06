'use client';
import dynamic from 'next/dynamic';
import { useState, useMemo, useCallback } from 'react';
import { DemoAdapter } from '@/lib/adapters/demo';
import { PRESETS } from '@/lib/office-config';
import type { OfficeConfig } from '@/lib/office-config';

const Office3D = dynamic(() => import('@/components/office-3d/Office3D'), { ssr: false });

const PRESET_KEYS = Object.keys(PRESETS);

export default function Home() {
  const [presetKey, setPresetKey] = useState('startup');

  const config: OfficeConfig = useMemo(() => ({
    name: 'My AI Office',
    ...PRESETS[presetKey],
  }), [presetKey]);

  const adapter = useMemo(() => new DemoAdapter(), []);

  const handleDeskClick = useCallback((deskId: string, agentId?: string) => {
    // Future: open agent card panel
    console.log('Desk clicked:', deskId, 'agent:', agentId);
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <Office3D
        config={config}
        adapter={adapter}
        officeId="demo"
        onDeskClick={handleDeskClick}
      />

      {/* Preset picker */}
      <div
        style={{
          position: 'absolute', top: 16, left: 16, zIndex: 10,
          display: 'flex', alignItems: 'center', gap: 8,
        }}
      >
        <select
          value={presetKey}
          onChange={(e) => setPresetKey(e.target.value)}
          className="glass-panel"
          style={{
            padding: '8px 12px', color: '#fff', cursor: 'pointer',
            fontSize: 13, border: '1px solid rgba(255,255,255,0.15)',
            background: 'rgba(10,10,20,0.85)',
            borderRadius: 8, outline: 'none',
          }}
        >
          {PRESET_KEYS.map(k => (
            <option key={k} value={k} style={{ background: '#1a1a2e' }}>
              {k.charAt(0).toUpperCase() + k.slice(1)}
            </option>
          ))}
        </select>
        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
          WASD to navigate
        </span>
      </div>
    </div>
  );
}
