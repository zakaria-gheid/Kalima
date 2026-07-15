import type { Team } from './team';
import type { Difficulty, Word } from './word';

export type GameStatus = 'idle' | 'playing' | 'paused' | 'finished';

/** An in-progress game: a shuffled deck played against a countdown. */
export interface GameSession {
  id: string;
  difficulty: Difficulty;
  /** Fisher–Yates shuffled once at session start; never reshuffled or repeated. */
  deck: readonly Word[];
  startedAt: number;
  /** Countdown length chosen before starting; the game ends when it reaches zero. */
  durationMs: number;
  /** The team playing this round: describer explains, guesser answers. */
  team: Team;
}

/** A finished game, as persisted for statistics. */
export interface GameSessionResult {
  id: string;
  difficulty: Difficulty;
  startedAt: number;
  endedAt: number;
  durationMs: number;
  elapsedMs: number;
  /** Cards won — these are the points banked for the team. */
  cardsCompleted: number;
  cardsSkipped: number;
  cardsTotal: number;
  /** Null only for legacy sessions recorded before teams existed. */
  team: Team | null;
}

export interface GameStats {
  totalSessions: number;
  totalCardsCompleted: number;
  totalPlayTimeMs: number;
  byDifficulty: Record<Difficulty, { sessions: number; cardsCompleted: number }>;
}
