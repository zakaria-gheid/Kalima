import type { Difficulty } from '@/domain/word';

const STYLES: Record<Difficulty, { label: string; className: string }> = {
  easy: { label: 'Easy', className: 'bg-easy/15 text-green-700 dark:text-green-400' },
  medium: { label: 'Medium', className: 'bg-medium/15 text-yellow-700 dark:text-yellow-400' },
  hard: { label: 'Hard', className: 'bg-hard/15 text-red-700 dark:text-red-400' },
};

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  const { label, className } = STYLES[difficulty];
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${className}`}>{label}</span>
  );
}
