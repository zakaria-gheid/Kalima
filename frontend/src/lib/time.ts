/** Formats a duration in milliseconds as MM:SS (minutes pad to 2+, capped at 99:59+ rolls naturally). */
export function formatMMSS(elapsedMs: number): string {
  const totalSeconds = Math.max(0, Math.floor(elapsedMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/** Time left on a countdown, clamped at zero. */
export function remainingMs(durationMs: number, elapsedMs: number): number {
  return Math.max(0, durationMs - elapsedMs);
}

import type { SkipCostMode } from '@/domain/settings';

/**
 * What a skip costs on the clock, from the configured mode: a percentage of
 * the round length or a fixed number of seconds. Clamped to at least 1s and
 * at most the whole round.
 */
export function skipPenaltyMs(
  durationMs: number,
  mode: SkipCostMode = 'percent',
  value = 10,
): number {
  const raw = mode === 'percent' ? (durationMs * value) / 100 : value * 1000;
  return Math.min(durationMs, Math.max(1000, Math.round(raw)));
}
