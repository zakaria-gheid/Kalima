import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import {
  CheckIcon,
  ForwardIcon,
  PauseIcon,
  PlayIcon,
  StopIcon,
} from '@heroicons/react/24/solid';
import { currentCard, useGameStore } from '@/store/gameStore';
import { useGameClock } from '@/presentation/hooks/useGameClock';
import { remainingMs } from '@/lib/time';
import { Button } from '@/presentation/components/Button';
import { TimerDisplay } from '@/presentation/components/TimerDisplay';
import { WordCard } from '@/presentation/components/WordCard';

export function GamePage() {
  const navigate = useNavigate();
  const session = useGameStore((state) => state.session);
  const status = useGameStore((state) => state.status);
  const currentIndex = useGameStore((state) => state.currentIndex);
  const correct = useGameStore((state) => state.correct);
  const card = useGameStore(currentCard);
  const markCorrect = useGameStore((state) => state.markCorrect);
  const skip = useGameStore((state) => state.skip);
  const pause = useGameStore((state) => state.pause);
  const resume = useGameStore((state) => state.resume);
  const endEarly = useGameStore((state) => state.endEarly);
  const elapsedMs = useGameClock();

  useEffect(() => {
    if (status === 'idle') navigate('/difficulty', { replace: true });
    if (status === 'finished') navigate('/completion', { replace: true });
  }, [status, navigate]);

  if (!session || !card || (status !== 'playing' && status !== 'paused')) {
    return null;
  }

  const paused = status === 'paused';

  return (
    <main className="flex flex-1 flex-col gap-4 py-1">
      <header className="flex items-center justify-between gap-2">
        <TimerDisplay remainingMs={remainingMs(session.durationMs, elapsedMs)} paused={paused} />
        <div className="flex items-center gap-2.5">
          <p
            aria-label={`${correct} words got`}
            aria-live="polite"
            className="inline-flex items-center gap-1 rounded-full bg-easy/15 px-2.5 py-1 text-sm font-bold tabular-nums text-green-700 dark:text-green-400"
          >
            <CheckIcon aria-hidden="true" className="size-4" />
            {correct}
          </p>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {currentIndex + 1} / {session.deck.length}
          </p>
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

      <div
        role="progressbar"
        aria-label="Deck progress"
        aria-valuemin={0}
        aria-valuemax={session.deck.length}
        aria-valuenow={currentIndex + 1}
        className="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"
      >
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${((currentIndex + 1) / session.deck.length) * 100}%` }}
        />
      </div>

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
