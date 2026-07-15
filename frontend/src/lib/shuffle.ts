/** A random source returning a float in [0, 1). Injectable for deterministic tests. */
export type RandomFn = () => number;

/**
 * Fisher–Yates shuffle. Returns a new array; the input is not mutated.
 * Every permutation is equally likely given a uniform random source.
 */
export function fisherYatesShuffle<T>(
  items: readonly T[],
  random: RandomFn = Math.random,
): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    const a = result[i] as T;
    const b = result[j] as T;
    result[i] = b;
    result[j] = a;
  }
  return result;
}
