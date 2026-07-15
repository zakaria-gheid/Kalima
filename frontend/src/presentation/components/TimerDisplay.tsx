import { ClockIcon } from '@heroicons/react/24/outline';
import { formatMMSS } from '@/lib/time';

interface TimerDisplayProps {
  /** Time left on the countdown, in milliseconds. */
  remainingMs: number;
  paused?: boolean;
}

const LOW_TIME_THRESHOLD_MS = 10_000;

export function TimerDisplay({ remainingMs, paused = false }: TimerDisplayProps) {
  const low = remainingMs <= LOW_TIME_THRESHOLD_MS && !paused;
  return (
    <div
      role="timer"
      aria-live={low ? 'polite' : 'off'}
      aria-label={`Time remaining ${formatMMSS(remainingMs)}${paused ? ', paused' : ''}`}
      className={`inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 font-mono text-base font-semibold tabular-nums shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700 ${
        low
          ? 'text-hard animate-pulse'
          : paused
            ? 'text-medium'
            : 'text-slate-900 dark:text-slate-100'
      }`}
    >
      <ClockIcon aria-hidden="true" className="size-4" />
      {formatMMSS(remainingMs)}
      {paused && <span className="font-sans text-xs">paused</span>}
    </div>
  );
}
