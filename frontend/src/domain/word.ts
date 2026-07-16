export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;

export type Difficulty = (typeof DIFFICULTIES)[number];

export function isDifficulty(value: string): value is Difficulty {
  return (DIFFICULTIES as readonly string[]).includes(value);
}

/** A word category, e.g. "Home", "Animals". Open set — defined by the seed data. */
export type Category = string;

export interface Word {
  id: number;
  english: string;
  arabic: string;
  category: Category;
  difficulty: Difficulty;
  enabled: boolean;
  /** Describer hint in English, stored per word. */
  hintEn: string;
  /** Describer hint in Arabic, stored per word. */
  hintAr: string;
}

export interface WordFilter {
  search?: string;
  difficulty?: Difficulty;
  category?: Category;
  enabledOnly?: boolean;
}
