import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CheckIcon,
  ForwardIcon,
  PauseIcon,
  PlayIcon,
  StopIcon,
} from '@heroicons/react/24/solid';
import { currentCard, useGameStore } from '@/store/gameStore';
import { useGameClock } from '@/presentation/hooks/useGameClock';
import { feedback } from '@/application/feedbackService';
import { remainingMs, skipPenaltyMs } from '@/lib/time';
import { Button } from '@/presentation/components/Button';
import { TimerDisplay } from '@/presentation/components/TimerDisplay';
import { WordCard } from '@/presentation/components/WordCard';

export function GamePage() {
  const navigate = useNavigate();
  const session = useGameStore((state) => state.session);
  const status = useGameStore((state) => state.status);
  const currentIndex = useGameStore((state) => state.currentIndex);
  const correct = useGameStore((state) => state.correct);
  const lastSkip = useGameStore((state) => state.lastSkip);
  const card = useGameStore(currentCard);
  const markCorrect = useGameStore((state) => state.markCorrect);
  const skip = useGameStore((state) => state.skip);
  const pause = useGameStore((state) => state.pause);
  const resume = useGameStore((state) => state.resume);
  const endEarly = useGameStore((state) => state.endEarly);
  const elapsedMs = useGameClock();

  const remaining = session ? remainingMs(session.durationMs, elapsedMs) : 0;
  const secondsLeft = Math.ceil(remaining / 1000);
  const playing = status === 'playing';

  // Clock tick once per second while the countdown runs.
  const lastTickedSecond = useRef<number | null>(null);
  useEffect(() => {
    if (!playing || secondsLeft <= 0) return;
    if (lastTickedSecond.current !== null && lastTickedSecond.current !== secondsLeft) {
      feedback.tick();
    }
    lastTickedSecond.current = secondsLeft;
  }, [secondsLeft, playing]);

  // Flash the timer red briefly whenever a skip penalty lands.
  const [flash, setFlash] = useState(false);
  useEffect(() => {
    if (!lastSkip) return;
    setFlash(true);
    const timeout = setTimeout(() => setFlash(false), 700);
    return () => clearTimeout(timeout);
  }, [lastSkip]);

  useEffect(() => {
    if (status === 'idle') navigate('/difficulty', { replace: true });
    if (status === 'finished') navigate('/completion', { replace: true });
  }, [status, navigate]);

  if (!session || !card || (status !== 'playing' && status !== 'paused')) {
    return null;
  }

  const paused = status === 'paused';
  const penaltySeconds = Math.round(skipPenaltyMs(session.durationMs) / 1000);

  return (
    <main className="flex flex-1 flex-col gap-3 py-1">
      <header className="flex items-center justify-between gap-2">
        <div className="flex w-16 flex-col items-center gap-1">
          <p
            aria-label={`${correct} words got`}
            aria-live="polite"
            className="inline-flex items-center gap-1 rounded-full bg-easy/15 px-2.5 py-1 text-base font-bold tabular-nums text-green-700 dark:text-green-400"
          >
            <CheckIcon aria-hidden="true" className="size-4" />
            {correct}
          </p>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">got</p>
        </div>

        <div className="relative">
          <TimerDisplay
            remainingMs={remaining}
            durationMs={session.durationMs}
            paused={paused}
            flash={flash}
          />
          <AnimatePresence>
            {lastSkip && flash && (
              <motion.span
                key={lastSkip.id}
                initial={{ opacity: 1, y: 0, x: 0, scale: 1 }}
                animate={{ opacity: 0, y: -44, x: 26, scale: 1.4 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                aria-hidden="true"
                className="pointer-events-none absolute -right-2 top-1 text-xl font-extrabold text-hard"
              >
                −{lastSkip.penaltySeconds}s
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <div className="flex w-16 flex-col items-center gap-1">
          <p className="text-base font-bold tabular-nums text-slate-700 dark:text-slate-200">
            {currentIndex + 1}
            <span className="text-xs font-medium text-slate-400"> / {session.deck.length}</span>
          </p>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">card</p>
        </div>
      </header>

      <p className="text-center text-xs text-slate-500 dark:text-slate-400">
        <span className="font-semibold text-slate-700 dark:text-slate-200">
          {session.team.describer}
        </span>{' '}
        describes ·{' '}
        <span className="font-semibold text-slate-700 dark:text-slate-200">
          {session.team.guesser}
        </span>{' '}
        guesses
      </p>

      <div className="relative flex flex-1 items-center">
        {paused ? (
          <div className="flex w-full flex-col items-center gap-3 rounded-card bg-white p-10 shadow-sm dark:bg-slate-800">
            <PauseIcon aria-hidden="true" className="size-10 text-medium" />
            <p className="text-lg font-bold">Game paused</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              The card is hidden while paused.
            </p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <WordCard key={card.id} word={card} />
          </AnimatePresence>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="success"
            onClick={() => void markCorrect()}
            disabled={paused}
            className="min-h-14 text-base"
          >
            <CheckIcon aria-hidden="true" className="size-5" />
            Got it!
          </Button>
          <Button
            variant="secondary"
            onClick={() => void skip()}
            disabled={paused}
            className="min-h-14 text-base"
          >
            <ForwardIcon aria-hidden="true" className="size-5" />
            Skip
            <span className="text-xs font-bold text-hard">−{penaltySeconds}s</span>
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {paused ? (
            <Button variant="primary" onClick={resume}>
              <PlayIcon aria-hidden="true" className="size-4" />
              Resume
            </Button>
          ) : (
            <Button variant="ghost" onClick={pause}>
              <PauseIcon aria-hidden="true" className="size-4" />
              Pause
            </Button>
          )}
          <Button
            variant="ghost"
            onClick={() => void endEarly()}
            className="text-hard hover:bg-hard/10 dark:text-red-400"
          >
            <StopIcon aria-hidden="true" className="size-4" />
            End Game
          </Button>
        </div>
      </div>
    </main>
  );
}
