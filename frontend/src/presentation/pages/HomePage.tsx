import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Cog6ToothIcon,
  ListBulletIcon,
  PlayIcon,
  TrophyIcon,
} from '@heroicons/react/24/solid';

const MENU = [
  {
    to: '/difficulty',
    label: 'Start Game',
    description: 'Team up, pick a difficulty, and play',
    icon: PlayIcon,
    primary: true,
  },
  {
    to: '/leaderboard',
    label: 'Leaderboard',
    description: 'See which team is best',
    icon: TrophyIcon,
    primary: false,
  },
  {
    to: '/words',
    label: 'Word List',
    description: 'Browse, search, and manage the 1600 cards',
    icon: ListBulletIcon,
    primary: false,
  },
  {
    to: '/settings',
    label: 'Settings',
    description: 'Theme and accessibility',
    icon: Cog6ToothIcon,
    primary: false,
  },
] as const;

export function HomePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 py-6">
      <motion.header
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center text-center"
      >
        <img src="/favicon.svg" alt="" aria-hidden="true" className="mb-3 size-16 drop-shadow" />
        <h1 className="bg-gradient-to-r from-primary to-violet-600 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent">
          Kalima
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Learn English while playing
        </p>
      </motion.header>

      <nav aria-label="Main menu" className="flex w-full max-w-sm flex-col gap-2.5">
        {MENU.map(({ to, label, description, icon: Icon, primary }, index) => (
          <motion.div
            key={to}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.04 * (index + 1) }}
          >
            <Link
              to={to}
              className={`flex min-h-12 items-center gap-3 rounded-2xl p-3 shadow-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                primary
                  ? 'bg-primary text-white shadow-primary/20 hover:bg-blue-700'
                  : 'bg-white text-slate-900 ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700 dark:hover:bg-slate-700'
              }`}
            >
              <span
                className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
                  primary ? 'bg-white/15' : 'bg-primary/10 text-primary'
                }`}
              >
                <Icon aria-hidden="true" className="size-5" />
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="text-[15px] font-semibold">{label}</span>
                <span className={`truncate text-xs ${primary ? 'text-white/80' : 'text-slate-500 dark:text-slate-400'}`}>
                  {description}
                </span>
              </span>
            </Link>
          </motion.div>
        ))}
      </nav>
    </main>
  );
}
