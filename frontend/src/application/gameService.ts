import type { GameSession, GameSessionResult, GameStats } from '@/domain/gameSession';
import type { Team } from '@/domain/team';
import type { Difficulty } from '@/domain/word';
import { fisherYatesShuffle } from '@/lib/shuffle';
import type { SessionRepository } from '@/infrastructure/repositories/sessionRepository';
import type { WordRepository } from '@/infrastructure/repositories/wordRepository';

export class GameService {
  constructor(
    private readonly words: WordRepository,
    private readonly sessions: SessionRepository,
  ) {}

  /**
   * Creates a new session: loads every enabled word of the difficulty and
   * shuffles the deck exactly once (Fisher–Yates). Cards never repeat within
   * a session because play simply walks the deck front to back. The game runs
   * against a countdown of durationMs.
   */
  createSession(difficulty: Difficulty, durationMs: number, team: Team): GameSession {
    if (!Number.isFinite(durationMs) || durationMs <= 0) {
      throw new Error(`Invalid game duration ${durationMs}ms`);
    }
    const pool = this.words.findEnabledByDifficulty(difficulty);
    if (pool.length === 0) {
      throw new Error(`No enabled words available for difficulty "${difficulty}"`);
    }
    return {
      id: crypto.randomUUID(),
      difficulty,
      deck: fisherYatesShuffle(pool),
      startedAt: Date.now(),
      durationMs,
      team,
    };
  }

  /** Persists a finished session for statistics. */
  recordResult(result: GameSessionResult): void {
    this.sessions.insert(result);
  }

  getStats(): GameStats {
    return this.sessions.getStats();
  }
}
