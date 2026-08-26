import { describe, expect, it } from 'vitest';

import { GAME_LEVELS, LEVEL_COUNT, getLevel, getNextLevelIndex } from './levels';

describe('five-level puzzle campaign', () => {
  it('contains five uniquely themed and positioned levels', () => {
    expect(LEVEL_COUNT).toBe(5);
    expect(new Set(GAME_LEVELS.map((level) => level.id)).size).toBe(5);
    expect(new Set(GAME_LEVELS.map((level) => level.themeKey)).size).toBe(5);
    expect(new Set(GAME_LEVELS.map((level) => level.targetBuilding.modelUrl)).size).toBe(5);
    expect(new Set(GAME_LEVELS.map((level) => level.toiletSign.position.join(','))).size).toBe(5);
    expect(new Set(GAME_LEVELS.map((level) => level.startPosition.join(','))).size).toBe(5);
  });

  it('keeps every authored start and approximate solution inside its movement bounds', () => {
    for (const level of GAME_LEVELS) {
      const [startX, , startZ] = level.startPosition;
      const { minX, maxX, minZ, maxZ } = level.movementBounds;
      expect(startX).toBeGreaterThanOrEqual(minX);
      expect(startX).toBeLessThanOrEqual(maxX);
      expect(startZ).toBeGreaterThanOrEqual(minZ);
      expect(startZ).toBeLessThanOrEqual(maxZ);

      const arrowX = level.toiletSign.position[0] + 4.35 * 0.363;
      const arrowZ = level.toiletSign.position[2] + 0.094;
      const targetX = level.targetBuilding.position[0];
      const targetZ = level.targetBuilding.position[2];
      const portraitPullback = 'portraitSolutionPullback' in level
        ? level.portraitSolutionPullback
        : level.solutionPullback;
      for (const pullback of [level.solutionPullback, portraitPullback]) {
        const solutionX = arrowX + pullback * (arrowX - targetX);
        const solutionZ = arrowZ + pullback * (arrowZ - targetZ);
        expect(solutionX).toBeGreaterThanOrEqual(minX);
        expect(solutionX).toBeLessThanOrEqual(maxX);
        expect(solutionZ).toBeGreaterThanOrEqual(minZ);
        expect(solutionZ).toBeLessThanOrEqual(maxZ);
      }
    }
  });

  it('advances through the campaign and loops only after the finale', () => {
    expect(getLevel(-99)).toBe(GAME_LEVELS[0]);
    expect(getLevel(99)).toBe(GAME_LEVELS[4]);
    expect(getNextLevelIndex(0)).toBe(1);
    expect(getNextLevelIndex(3)).toBe(4);
    expect(getNextLevelIndex(4)).toBeNull();
  });
});
