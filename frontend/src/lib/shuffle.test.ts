import { describe, expect, it } from 'vitest';
import { fisherYatesShuffle, type RandomFn } from './shuffle';

/** Deterministic LCG so shuffle results are reproducible in tests. */
function makeLcg(seed: number): RandomFn {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
}

describe('fisherYatesShuffle', () => {
  it('returns a new array and does not mutate the input', () => {
    const input = [1, 2, 3, 4, 5];
    const snapshot = [...input];
    const result = fisherYatesShuffle(input, makeLcg(42));
    expect(input).toEqual(snapshot);
    expect(result).not.toBe(input);
  });

  it('returns a permutation: same elements, same length, no repeats or losses', () => {
    const input = Array.from({ length: 100 }, (_, i) => i);
    const result = fisherYatesShuffle(input, makeLcg(7));
    expect(result).toHaveLength(100);
    expect(new Set(result).size).toBe(100);
    expect([...result].sort((a, b) => a - b)).toEqual(input);
  });

  it('handles empty and single-element arrays', () => {
    expect(fisherYatesShuffle([])).toEqual([]);
    expect(fisherYatesShuffle(['only'])).toEqual(['only']);
  });

  it('is deterministic for a given random source', () => {
    const input = ['a', 'b', 'c', 'd', 'e', 'f'];
    expect(fisherYatesShuffle(input, makeLcg(123))).toEqual(
      fisherYatesShuffle(input, makeLcg(123)),
    );
  });

  it('produces all permutations of a small array with roughly uniform frequency', () => {
    const random = makeLcg(99);
    const counts = new Map<string, number>();
    const trials = 6000;
    for (let i = 0; i < trials; i++) {
      const key = fisherYatesShuffle([1, 2, 3], random).join(',');
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    // 3! = 6 permutations, expected 1000 each; allow generous ±35% slack.
    expect(counts.size).toBe(6);
    for (const count of counts.values()) {
      expect(count).toBeGreaterThan(650);
      expect(count).toBeLessThan(1350);
    }
  });
});
