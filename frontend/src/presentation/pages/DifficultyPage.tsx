import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { ArrowLeftIcon, ArrowPathIcon, ArrowsRightLeftIcon } from '@heroicons/react/24/outline';
import { PlayIcon } from '@heroicons/react/24/solid';
import { DIFFICULTIES, type Difficulty } from '@/domain/word';
import { GAME_DURATION_OPTIONS } from '@/domain/settings';
import type { TeamInput } from '@/domain/team';
import { useGameStore } from '@/store/gameStore';
import { useSettingsStore } from '@/store/settingsStore';
import {
  useRemainingCounts,
  useResetCardPool,
  useWordCounts,
} from '@/presentation/hooks/useWords';
import { useLastTeam } from '@/presentation/hooks/useTeams';
import { IconButton } from '@/presentation/components/IconButton';
import { formatMMSS } from '@/lib/time';

const CARDS: Record<
  Difficulty,
  { label: string; dot: string; tint: string; accent: string; ring: string }
> = {
  easy: {
    label: 'Easy',
    dot: 'bg-easy',
    tint: 'bg-easy/15',
    accent: 'text-green-600 dark:text-green-400',
    ring: 'focus-visible:outline-easy',
  },
  medium: {
    label: 'Medium',
    dot: 'bg-medium',
    tint: 'bg-medium/15',
    accent: 'text-yellow-600 dark:text-yellow-400',
    ring: 'focus-visible:outline-medium',
  },
  hard: {
    label: 'Hard',
    dot: 'bg-hard',
    tint: 'bg-hard/15',
    accent: 'text-red-600 dark:text-red-400',
    ring: 'focus-visible:outline-hard',
  },
};

const inputClasses =
  'min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-[15px] shadow-sm focus-visible:outline-2 focus-visible:outline-primary dark:border-slate-700 dark:bg-slate-800';

const sectionHeading =
  'text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400';

export function DifficultyPage() {
  const navigate = useNavigate();
  const start = useGameStore((state) => state.start);
  const gameDurationSec = useSettingsStore((state) => state.gameDurationSec);
  const setGameDurationSec = useSettingsStore((state) => state.setGameDurationSec);
  const { data: counts } = useWordCounts();
  const { data: remaining } = useRemainingCounts();
  const resetPool = useResetCardPool();
  const { data: lastTeam } = useLastTeam();

  const poolPartiallyUsed =
    counts !== undefined &&
    remaining !== undefined &&
    DIFFICULTIES.some((d) => remaining[d] < counts[d]);

  const {
    register,
    getValues,
    setValue,
    trigger,
    reset,
    formState: { errors, isDirty },
  } = useForm<TeamInput>({
    defaultValues: { describer: '', guesser: '' },
    mode: 'onBlur',
  });

  // Prefill with the last team that played (unless the user already typed).
  useEffect(() => {
    if (lastTeam && !isDirty) reset(lastTeam);
  }, [lastTeam, isDirty, reset]);

  function swapRoles() {
    const { describer, guesser } = getValues();
    setValue('describer', guesser, { shouldDirty: true });
    setValue('guesser', describer, { shouldDirty: true });
  }

  async function handleStart(difficulty: Difficulty) {
    if (!(await trigger())) return;
    await start(difficulty, gameDurationSec * 1000, getValues());
    navigate('/game');
  }

  return (
    <main className="flex flex-1 flex-col gap-6 py-2">
      <header className="flex items-center gap-3">
        <IconButton aria-label="Back to home" onClick={() => navigate('/')}>
          <ArrowLeftIcon aria-hidden="true" className="size-6" />
        </IconButton>
        <h1 className="text-xl font-bold">New game</h1>
      </header>

      <section aria-labelledby="team-heading" className="flex flex-col gap-2.5">
        <h2 id="team-heading" className={sectionHeading}>
          Team
        </h2>
        <div className="flex items-end gap-2">
          <label className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Describer
            </span>
            <input
              type="text"
              autoComplete="off"
              placeholder="Who explains?"
              aria-invalid={errors.describer ? true : undefined}
              {...register('describer', { required: true, validate: (v) => v.trim().length > 0 })}
              className={`${inputClasses} ${errors.describer ? 'border-hard' : ''}`}
            />
          </label>
          <button
            type="button"
            onClick={swapRoles}
            aria-label="Swap describer and guesser"
            title="Swap roles"
            className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            <ArrowsRightLeftIcon aria-hidden="true" className="size-5" />
          </button>
          <label className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Guesser</span>
            <input
              type="text"
              autoComplete="off"
              placeholder="Who guesses?"
              aria-invalid={errors.guesser ? true : undefined}
              {...register('guesser', { required: true, validate: (v) => v.trim().length > 0 })}
              className={`${inputClasses} ${errors.guesser ? 'border-hard' : ''}`}
            />
          </label>
        </div>
        {(errors.describer || errors.guesser) && (
          <p role="alert" className="text-xs font-medium text-hard">
            Enter a name for both the describer and the guesser.
          </p>
        )}
      </section>

      <section aria-labelledby="duration-heading" className="flex flex-col gap-2.5">
        <h2 id="duration-heading" className={sectionHeading}>
          Round length
        </h2>
        <div role="radiogroup" aria-labelledby="duration-heading" className="grid grid-cols-4 gap-2">
          {GAME_DURATION_OPTIONS.map((seconds) => {
            const selected = gameDurationSec === seconds;
            return (
              <button
                key={seconds}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => void setGameDurationSec(seconds)}
                className={`min-h-11 rounded-xl border font-mono text-sm font-semibold tabular-nums transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                  selected
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                {formatMMSS(seconds * 1000)}
              </button>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="difficulty-heading" className="flex flex-col gap-2.5">
        <div className="flex min-h-8 items-center justify-between">
          <h2 id="difficulty-heading" className={sectionHeading}>
            Difficulty
          </h2>
          {poolPartiallyUsed && (
            <button
              type="button"
              onClick={() => resetPool.mutate()}
              disabled={resetPool.isPending}
              className="inline-flex min-h-8 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold text-primary hover:bg-primary/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50"
            >
              <ArrowPathIcon aria-hidden="true" className="size-4" />
              Reset card pool
            </button>
          )}
        </div>
        <p className="sr-only" aria-live="polite">
          Cards that already appeared stay out of new games until every card has been played.
        </p>
        {DIFFICULTIES.map((difficulty, index) => {
          const card = CARDS[difficulty];
          const count = counts?.[difficulty] ?? 0;
          const left = remaining?.[difficulty] ?? count;
          return (
            <motion.button
              key={difficulty}
              type="button"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.04 * index }}
              onClick={() => void handleStart(difficulty)}
              disabled={count === 0}
              className={`flex min-h-16 w-full items-center gap-3 rounded-2xl bg-white p-3 text-left shadow-sm ring-1 ring-slate-200/70 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-800 dark:ring-slate-700/60 dark:hover:bg-slate-700 ${card.ring}`}
            >
              <span
                aria-hidden="true"
                className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${card.tint}`}
              >
                <span className={`size-3.5 rounded-full ${card.dot}`} />
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-[15px] font-semibold">{card.label}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {left < count ? `${left} of ${count} cards left` : `${count} words`}
                </span>
              </span>
              <PlayIcon aria-hidden="true" className={`size-5 shrink-0 ${card.accent}`} />
            </motion.button>
          );
        })}
      </section>
    </main>
  );
}
