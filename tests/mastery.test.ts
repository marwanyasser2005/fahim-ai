import { describe, expect, it } from 'vitest';
import { calculateMastery } from '../src/lib/mastery';

describe('calculateMastery', () => {
  it('converts a score into a rounded percentage', () => {
    expect(calculateMastery(4, 5)).toBe(80);
    expect(calculateMastery(2, 3)).toBe(67);
  });

  it('clamps invalid or out-of-range values', () => {
    expect(calculateMastery(8, 5)).toBe(100);
    expect(calculateMastery(-2, 5)).toBe(0);
    expect(calculateMastery(2, 0)).toBe(0);
    expect(calculateMastery(Number.NaN, 5)).toBe(0);
  });
});
