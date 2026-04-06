import { describe, it, expect } from 'vitest';
import { getCorridorPath, CORRIDOR_X } from '@/components/office-3d/core/constants';

describe('getCorridorPath', () => {
  it('returns direct path for close positions', () => {
    const path = getCorridorPath([1, 0, 1], [2, 0, 2]);
    expect(path).toEqual([[2, 0, 2]]);
  });

  it('routes through corridor for distant positions', () => {
    const path = getCorridorPath([-4, 0, -3], [3, 0, 3]);
    expect(path).toHaveLength(3);
    // First waypoint: enter corridor at current Z
    expect(path[0][0]).toBe(CORRIDOR_X);
    expect(path[0][2]).toBe(-3);
    // Second waypoint: walk along corridor to target Z
    expect(path[1][0]).toBe(CORRIDOR_X);
    expect(path[1][2]).toBe(3);
    // Third: final destination
    expect(path[2]).toEqual([3, 0, 3]);
  });

  it('returns direct path for same position', () => {
    const path = getCorridorPath([0, 0, 0], [0, 0, 0]);
    expect(path).toEqual([[0, 0, 0]]);
  });

  it('all waypoints have y=0', () => {
    const path = getCorridorPath([-5, 0, -4], [5, 0, 4]);
    for (const wp of path) {
      expect(wp[1]).toBe(0);
    }
  });
});
