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

/** What a skip costs on the clock: 10% of the round length (within the 8–12% spec). */
export function skipPenaltyMs(durationMs: number): number {
  return Math.round(durationMs * 0.1);
}
