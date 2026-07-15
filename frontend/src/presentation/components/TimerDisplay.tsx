import { formatMMSS } from '@/lib/time';

interface TimerDisplayProps {
  /** Time left on the countdown, in milliseconds. */
  remainingMs: number;
  /** Full round length, for the depleting progress ring. */
  durationMs: number;
  paused?: boolean;
  /** Briefly true after a skip penalty — flashes the ring red. */
  flash?: boolean;
}

const LOW_TIME_THRESHOLD_MS = 10_000;
const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * The countdown as a prominent circular ring: the arc depletes with time,
 * turns amber while paused, and red (pulsing) in the last 10 seconds or
 * when a skip penalty flashes.
 */
export function TimerDisplay({
  remainingMs,
  durationMs,
  paused = false,
  flash = false,
}: TimerDisplayProps) {
  const low = remainingMs <= LOW_TIME_THRESHOLD_MS && !paused;
  const alert = low || flash;
  const fraction = durationMs > 0 ? Math.max(0, Math.min(1, remainingMs / durationMs)) : 0;

  const ringClass = alert ? 'stroke-hard' : paused ? 'stroke-medium' : 'stroke-primary';
  const textClass = alert
    ? 'text-hard'
    : paused
      ? 'text-yellow-600 dark:text-yellow-400'
      : 'text-slate-900 dark:text-slate-100';

  return (
    <div
      role="timer"
      aria-live={low ? 'polite' : 'off'}
      aria-label={`Time remaining ${formatMMSS(remainingMs)}${paused ? ', paused' : ''}`}
      className={`relative size-32 ${alert ? 'animate-pulse' : ''}`}
    >
      <svg viewBox="0 0 120 120" className="size-full -rotate-90">
        <circle
          cx="60"
          cy="60"
          r={RADIUS}
          fill="none"
          strokeWidth="8"
          className="stroke-slate-200 dark:stroke-slate-700"
        />
        <circle
          cx="60"
          cy="60"
          r={RADIUS}
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - fraction)}
          className={`transition-[stroke-dashoffset,stroke] duration-300 ${ringClass}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`font-mono text-2xl font-bold tabular-nums ${textClass}`}>
          {formatMMSS(remainingMs)}
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          {paused ? 'paused' : 'left'}
        </span>
      </div>
    </div>
  );
}
