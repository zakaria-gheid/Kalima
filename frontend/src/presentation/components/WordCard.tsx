import { motion } from 'framer-motion';
import type { Word } from '@/domain/word';
import { DifficultyBadge } from './DifficultyBadge';

interface WordCardProps {
  word: Word;
}

/**
 * The main game card. English renders LTR (≥48px), Arabic renders RTL (≥40px),
 * both in the same card per the bilingual design requirement.
 */
export function WordCard({ word }: WordCardProps) {
  return (
    <motion.div
      key={word.id}
      initial={{ opacity: 0, x: 48 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -48 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="flex w-full flex-col items-center gap-5 rounded-card bg-white p-6 shadow-sm ring-1 ring-slate-200/60 dark:bg-slate-800 dark:ring-slate-700/60"
    >
      <div className="flex w-full items-center justify-between">
        <DifficultyBadge difficulty={word.difficulty} />
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500 dark:bg-slate-700 dark:text-slate-300">
          {word.category}
        </span>
      </div>
      <p dir="ltr" lang="en" className="text-center text-5xl font-bold tracking-tight">
        {word.english}
      </p>
      <p dir="rtl" lang="ar" className="text-center text-[40px] font-semibold leading-snug">
        {word.arabic}
      </p>
    </motion.div>
  );
}
