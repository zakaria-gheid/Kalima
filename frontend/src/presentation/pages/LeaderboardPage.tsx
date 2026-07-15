import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeftIcon, TrashIcon } from '@heroicons/react/24/outline';
import { TrophyIcon } from '@heroicons/react/24/solid';
import { useClearLeaderboard, useLeaderboard } from '@/presentation/hooks/useTeams';
import { Button } from '@/presentation/components/Button';
import { IconButton } from '@/presentation/components/IconButton';

const MEDALS = ['🥇', '🥈', '🥉'];

export function LeaderboardPage() {
  const navigate = useNavigate();
  const { data: standings, isLoading } = useLeaderboard();
  const clearLeaderboard = useClearLeaderboard();
  const [confirmingClear, setConfirmingClear] = useState(false);

  function handleClear() {
    clearLeaderboard.mutate(undefined, {
      onSettled: () => setConfirmingClear(false),
    });
  }

  return (
    <main className="flex flex-1 flex-col gap-4 py-2">
      <header className="flex items-center gap-3">
        <IconButton aria-label="Back to home" onClick={() => navigate('/')}>
          <ArrowLeftIcon aria-hidden="true" className="size-6" />
        </IconButton>
        <h1 className="flex flex-1 items-center gap-2 text-xl font-bold">
          <TrophyIcon aria-hidden="true" className="size-6 text-medium" />
          Leaderboard
        </h1>
        {standings && standings.length > 0 && !confirmingClear && (
          <IconButton
            variant="danger"
            aria-label="Clear all results"
            title="Clear all results"
            onClick={() => setConfirmingClear(true)}
          >
            <TrashIcon aria-hidden="true" className="size-6" />
          </IconButton>
        )}
      </header>

      {confirmingClear && (
        <div
          role="alertdialog"
          aria-label="Confirm clearing all results"
          className="flex flex-col gap-3 rounded-2xl border border-hard/30 bg-white p-4 shadow-sm dark:bg-slate-800"
        >
          <p className="text-sm font-semibold">
            Delete all previous results?
            <span className="block text-xs font-normal text-slate-500 dark:text-slate-400">
              Every team and its points will be removed. This cannot be undone.
            </span>
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="danger" onClick={handleClear} disabled={clearLeaderboard.isPending}>
              <TrashIcon aria-hidden="true" className="size-4" />
              {clearLeaderboard.isPending ? 'Clearing…' : 'Clear all'}
            </Button>
            <Button variant="secondary" onClick={() => setConfirmingClear(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <p className="text-slate-600 dark:text-slate-400">Loading…</p>
      ) : !standings || standings.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
          <p aria-hidden="true" className="text-5xl">
            🏆
          </p>
          <p className="text-lg font-semibold">No games played yet</p>
          <p className="text-slate-600 dark:text-slate-400">
            Finish a round and your team will appear here.
          </p>
          <Button variant="primary" onClick={() => navigate('/difficulty')} className="mt-2">
            Start a game
          </Button>
        </div>
      ) : (
        <ol aria-label="Teams ranked by total points" className="flex flex-col gap-1.5">
          {standings.map((standing, index) => (
            <motion.li
              key={standing.teamId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(index, 8) * 0.03 }}
              className={`flex items-center gap-3 rounded-xl bg-white px-3 py-2.5 shadow-sm ring-1 dark:bg-slate-800 ${
                index === 0 ? 'ring-medium' : 'ring-slate-200/60 dark:ring-slate-700/60'
              }`}
            >
              <span
                aria-label={`Rank ${index + 1}`}
                className="flex size-8 shrink-0 items-center justify-center text-lg font-bold text-slate-400"
              >
                {MEDALS[index] ?? index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-semibold">
                  {standing.describer} & {standing.guesser}
                </p>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                  {standing.describer} describes · {standing.guesser} guesses ·{' '}
                  {standing.gamesPlayed} game{standing.gamesPlayed === 1 ? '' : 's'}
                </p>
              </div>
              <p className="shrink-0 text-right">
                <span className="block text-lg font-extrabold tabular-nums text-primary">
                  {standing.totalPoints}
                </span>
                <span className="-mt-1 block text-[10px] font-medium text-slate-400">points</span>
              </p>
            </motion.li>
          ))}
        </ol>
      )}
    </main>
  );
}
