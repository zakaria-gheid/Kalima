import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TrashIcon } from '@heroicons/react/24/outline';
import { ArrowPathIcon, HomeIcon, TrophyIcon } from '@heroicons/react/24/solid';
import { formatMMSS } from '@/lib/time';
import { useGameStore } from '@/store/gameStore';
import { Button } from '@/presentation/components/Button';
import { DifficultyBadge } from '@/presentation/components/DifficultyBadge';

export function CompletionPage() {
  const navigate = useNavigate();
  const result = useGameStore((state) => state.lastResult);
  const discardLastGame = useGameStore((state) => state.discardLastGame);
  const [confirmingDiscard, setConfirmingDiscard] = useState(false);

  useEffect(() => {
    if (!result) navigate('/', { replace: true });
  }, [result, navigate]);

  if (!result) return null;

  const timedOut = result.elapsedMs >= result.durationMs;

  // No store reset here — clearing the result would re-trigger the guard
  // effect above and hijack the navigation. start() reinitializes the whole
  // game state when the next round begins.
  function playAgain() {
    navigate('/difficulty');
  }

  function goHome() {
    navigate('/');
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-5 py-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex w-full max-w-sm flex-col items-center gap-4 rounded-card bg-white p-6 shadow-sm ring-1 ring-slate-200/60 dark:bg-slate-800 dark:ring-slate-700/60"
      >
        <p aria-hidden="true" className="text-5xl">
          {timedOut ? '⏰' : '🎉'}
        </p>
        <h1 className="text-2xl font-extrabold">{timedOut ? "Time's up!" : 'Well played!'}</h1>
        {result.team && (
          <p className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
            {result.team.describer} & {result.team.guesser}
            <span className="rounded-full bg-easy/15 px-2.5 py-0.5 text-xs font-bold text-green-700 dark:text-green-400">
              +{result.cardsCompleted} pts
            </span>
          </p>
        )}
        <DifficultyBadge difficulty={result.difficulty} />

        <dl className="grid w-full grid-cols-2 gap-2 text-center">
          <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-700/50">
            <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">Time played</dt>
            <dd className="mt-0.5 font-mono text-xl font-bold tabular-nums">
              {formatMMSS(result.elapsedMs)}
              <span className="text-xs font-medium text-slate-400">
                {' '}
                / {formatMMSS(result.durationMs)}
              </span>
            </dd>
          </div>
          <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-700/50">
            <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">Cards won</dt>
            <dd className="mt-0.5 text-xl font-bold">
              {result.cardsCompleted}
              <span className="text-xs font-medium text-slate-400"> / {result.cardsTotal}</span>
            </dd>
          </div>
        </dl>
        {result.cardsSkipped > 0 && (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {result.cardsSkipped} card{result.cardsSkipped === 1 ? '' : 's'} skipped
          </p>
        )}
      </motion.div>

      <div className="flex w-full max-w-sm flex-col gap-2">
        <Button variant="primary" onClick={playAgain}>
          <ArrowPathIcon aria-hidden="true" className="size-4" />
          Play Again
        </Button>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={() => navigate('/leaderboard')}>
            <TrophyIcon aria-hidden="true" className="size-4" />
            Leaderboard
          </Button>
          <Button variant="secondary" onClick={goHome}>
            <HomeIcon aria-hidden="true" className="size-4" />
            Home
          </Button>
        </div>
        {confirmingDiscard ? (
          <div
            role="alertdialog"
            aria-label="Confirm discarding this game"
            className="flex flex-col gap-2 rounded-2xl border border-hard/30 bg-white p-3 dark:bg-slate-800"
          >
            <p className="text-center text-sm font-medium">
              Discard this game? It won't count in any leaderboard or statistic.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="danger" onClick={() => void discardLastGame()}>
                <TrashIcon aria-hidden="true" className="size-4" />
                Discard
              </Button>
              <Button variant="secondary" onClick={() => setConfirmingDiscard(false)}>
                Keep it
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="ghost"
            onClick={() => setConfirmingDiscard(true)}
            className="text-hard hover:bg-hard/10 dark:text-red-400"
          >
            <TrashIcon aria-hidden="true" className="size-4" />
            Discard game
          </Button>
        )}
      </div>
    </main>
  );
}
