import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeftIcon, TrashIcon } from '@heroicons/react/24/outline';
import { TrophyIcon } from '@heroicons/react/24/solid';
import {
  useClearLeaderboard,
  useLeaderboard,
  usePlayerStandings,
} from '@/presentation/hooks/useTeams';
import { Button } from '@/presentation/components/Button';
import { IconButton } from '@/presentation/components/IconButton';

const MEDALS = ['🥇', '🥈', '🥉'];

const TABS = [
  { key: 'teams', label: 'Teams' },
  { key: 'describers', label: 'Describers' },
  { key: 'guessers', label: 'Guessers' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

interface RowProps {
  index: number;
  title: string;
  subtitle: string;
  avgPoints: number;
  highlight: boolean;
}

function StandingRow({ index, title, subtitle, avgPoints, highlight }: RowProps) {
  return (
    <motion.li
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 8) * 0.03 }}
      className={`flex items-center gap-3 rounded-xl bg-white px-3 py-2.5 shadow-sm ring-1 dark:bg-slate-800 ${
        highlight ? 'ring-medium' : 'ring-slate-200/60 dark:ring-slate-700/60'
      }`}
    >
      <span
        aria-label={`Rank ${index + 1}`}
        className="flex size-8 shrink-0 items-center justify-center text-lg font-bold text-slate-400"
      >
        {MEDALS[index] ?? index + 1}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-semibold">{title}</p>
        <p className="truncate text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
      </div>
      <p className="shrink-0 text-right">
        <span className="block text-lg font-extrabold tabular-nums text-primary">
          {avgPoints.toFixed(1)}
        </span>
        <span className="-mt-1 block text-[10px] font-medium text-slate-400">pts / game</span>
      </p>
    </motion.li>
  );
}

export function LeaderboardPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabKey>('teams');
  const { data: teams, isLoading } = useLeaderboard();
  const { data: describers } = usePlayerStandings('describer');
  const { data: guessers } = usePlayerStandings('guesser');
  const clearLeaderboard = useClearLeaderboard();
  const [confirmingClear, setConfirmingClear] = useState(false);

  const hasData = (teams?.length ?? 0) > 0;

  function handleClear() {
    clearLeaderboard.mutate(undefined, {
      onSettled: () => setConfirmingClear(false),
    });
  }

  const gamesLabel = (n: number) => `${n} game${n === 1 ? '' : 's'}`;

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
        {hasData && !confirmingClear && (
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
      ) : !hasData ? (
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
        <>
          <div
            role="tablist"
            aria-label="Leaderboard categories"
            className="grid grid-cols-3 gap-1 rounded-xl bg-slate-200/60 p-1 dark:bg-slate-800"
          >
            {TABS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={tab === key}
                onClick={() => setTab(key)}
                className={`min-h-10 rounded-lg text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                  tab === key
                    ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Ranked by points per game, so teams with few games aren't mixed unfairly with teams
            that played many. Ties go to whoever played more games.
          </p>

          {tab === 'teams' && (
            <ol aria-label="Teams ranked by points per game" className="flex flex-col gap-1.5">
              {(teams ?? []).map((standing, index) => (
                <StandingRow
                  key={standing.teamId}
                  index={index}
                  title={`${standing.describer} & ${standing.guesser}`}
                  subtitle={`${standing.describer} describes · ${standing.guesser} guesses · ${gamesLabel(standing.gamesPlayed)} · ${standing.totalPoints} pts total`}
                  avgPoints={standing.avgPoints}
                  highlight={index === 0}
                />
              ))}
            </ol>
          )}
          {tab === 'describers' && (
            <ol aria-label="Best describers" className="flex flex-col gap-1.5">
              {(describers ?? []).map((standing, index) => (
                <StandingRow
                  key={standing.name}
                  index={index}
                  title={standing.name}
                  subtitle={`${gamesLabel(standing.gamesPlayed)} as describer · ${standing.totalPoints} pts total`}
                  avgPoints={standing.avgPoints}
                  highlight={index === 0}
                />
              ))}
            </ol>
          )}
          {tab === 'guessers' && (
            <ol aria-label="Best guessers" className="flex flex-col gap-1.5">
              {(guessers ?? []).map((standing, index) => (
                <StandingRow
                  key={standing.name}
                  index={index}
                  title={standing.name}
                  subtitle={`${gamesLabel(standing.gamesPlayed)} as guesser · ${standing.totalPoints} pts total`}
                  avgPoints={standing.avgPoints}
                  highlight={index === 0}
                />
              ))}
            </ol>
          )}
        </>
      )}
    </main>
  );
}
