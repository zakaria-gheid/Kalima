export type TimerStatus = 'idle' | 'running' | 'paused';

export type NowFn = () => number;

/**
 * Stopwatch with start / pause / resume / reset semantics.
 * Time is derived from an injectable clock, so pausing is exact and the
 * service is fully unit-testable without real timers.
 */
export class TimerService {
  private accumulatedMs = 0;
  private runningSince: number | null = null;

  constructor(private readonly now: NowFn = () => Date.now()) {}

  get status(): TimerStatus {
    if (this.runningSince !== null) return 'running';
    return this.accumulatedMs > 0 ? 'paused' : 'idle';
  }

  /** Starts from zero. Restarting an active timer resets it first. */
  start(): void {
    this.accumulatedMs = 0;
    this.runningSince = this.now();
  }

  pause(): void {
    if (this.runningSince === null) return;
    this.accumulatedMs += this.now() - this.runningSince;
    this.runningSince = null;
  }

  resume(): void {
    if (this.runningSince !== null) return;
    this.runningSince = this.now();
  }

  reset(): void {
    this.accumulatedMs = 0;
    this.runningSince = null;
  }

  /**
   * Burns extra time off the countdown (e.g. a skip penalty) by advancing
   * the elapsed time. Works while running or paused.
   */
  addPenalty(ms: number): void {
    if (ms > 0) this.accumulatedMs += ms;
  }

  elapsedMs(): number {
    const live = this.runningSince !== null ? this.now() - this.runningSince : 0;
    return this.accumulatedMs + live;
  }
}
