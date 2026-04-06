import { describe, it, expect } from 'vitest';
import { PRESETS } from '@/lib/office-config';
import { generateLayout, DEFAULT_ROOM_WIDTH, DEFAULT_ROOM_DEPTH, DEFAULT_ROOM_HEIGHT } from '@/components/office-3d/core/constants';

describe('PRESETS', () => {
  it('has 4 presets', () => {
    expect(Object.keys(PRESETS)).toEqual(['startup', 'corporate', 'creative', 'minimal']);
  });

  it('each preset has desks and roomSize', () => {
    for (const [key, preset] of Object.entries(PRESETS)) {
      expect(preset.desks.length, `${key} should have desks`).toBeGreaterThan(0);
      expect(preset.roomSize, `${key} should have roomSize`).toBeDefined();
      expect(preset.roomSize!.width).toBeGreaterThan(0);
      expect(preset.roomSize!.depth).toBeGreaterThan(0);
    }
  });

  it('each desk has id and label', () => {
    for (const preset of Object.values(PRESETS)) {
      for (const desk of preset.desks) {
        expect(desk.id).toBeTruthy();
        expect(desk.label).toBeTruthy();
      }
    }
  });
});

describe('generateLayout', () => {
  it('generates correct workstation count for startup preset', () => {
    const layout = generateLayout({ name: 'Test', ...PRESETS.startup });
    expect(Object.keys(layout.workstations)).toHaveLength(4);
  });

  it('generates correct workstation count for corporate preset', () => {
    const layout = generateLayout({ name: 'Test', ...PRESETS.corporate });
    expect(Object.keys(layout.workstations)).toHaveLength(6);
  });

  it('uses default dimensions when roomSize not provided', () => {
    const layout = generateLayout({ name: 'Test', desks: [{ id: 'a', label: 'A' }] });
    expect(layout.roomWidth).toBe(DEFAULT_ROOM_WIDTH);
    expect(layout.roomDepth).toBe(DEFAULT_ROOM_DEPTH);
    expect(layout.roomHeight).toBe(DEFAULT_ROOM_HEIGHT);
  });

  it('handles zero desks without NaN', () => {
    const layout = generateLayout({ name: 'Empty', desks: [] });
    expect(Object.keys(layout.workstations)).toHaveLength(0);
    expect(layout.restPositions.length).toBeGreaterThan(0);
    expect(layout.roomWidth).toBe(DEFAULT_ROOM_WIDTH);
    // No NaN in any position
    for (const pos of layout.restPositions) {
      expect(Number.isFinite(pos[0])).toBe(true);
      expect(Number.isFinite(pos[1])).toBe(true);
      expect(Number.isFinite(pos[2])).toBe(true);
    }
  });

  it('clamps negative room dimensions to minimum', () => {
    const layout = generateLayout({
      name: 'Negative',
      desks: [{ id: 'a', label: 'A' }],
      roomSize: { width: -5, depth: -10 },
    });
    expect(layout.roomWidth).toBeGreaterThanOrEqual(4);
    expect(layout.roomDepth).toBeGreaterThanOrEqual(4);
  });

  it('caps at 12 desks', () => {
    const manyDesks = Array.from({ length: 20 }, (_, i) => ({ id: `d${i}`, label: `Desk ${i}` }));
    const layout = generateLayout({ name: 'Many', desks: manyDesks });
    expect(Object.keys(layout.workstations)).toHaveLength(12);
  });

  it('all positions are finite numbers', () => {
    for (const preset of Object.values(PRESETS)) {
      const layout = generateLayout({ name: 'Test', ...preset });
      for (const pos of Object.values(layout.workstations)) {
        expect(Number.isFinite(pos[0]), `x should be finite`).toBe(true);
        expect(Number.isFinite(pos[1]), `y should be finite`).toBe(true);
        expect(Number.isFinite(pos[2]), `z should be finite`).toBe(true);
      }
    }
  });

  it('maps agentName to roleToStation', () => {
    const layout = generateLayout({
      name: 'Test',
      desks: [
        { id: 'research', label: 'Research', agentName: 'Alice' },
        { id: 'content', label: 'Content', agentName: 'Bob' },
      ],
    });
    expect(layout.roleToStation['Alice']).toBe('research');
    expect(layout.roleToStation['Bob']).toBe('content');
  });

  it('generates 6 rest positions', () => {
    const layout = generateLayout({ name: 'Test', desks: [{ id: 'a', label: 'A' }] });
    expect(layout.restPositions).toHaveLength(6);
  });

  it('single desk is centered', () => {
    const layout = generateLayout({
      name: 'Solo',
      desks: [{ id: 'solo', label: 'Solo' }],
    });
    const pos = layout.workstations['solo'];
    expect(pos[0]).toBe(0); // centered on x
  });
});
