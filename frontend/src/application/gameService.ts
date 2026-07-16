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
   * Creates a new session from the pool of cards that have not appeared yet:
   * a card shown in any game stays out of every following deck until the
   * whole pool has been played, at which point the pool resets automatically.
   * The deck is shuffled exactly once (Fisher–Yates), so order stays random
   * and cards never repeat within a session either. The game runs against a
   * countdown of durationMs.
   */
  createSession(difficulty: Difficulty, durationMs: number, team: Team): GameSession {
    if (!Number.isFinite(durationMs) || durationMs <= 0) {
      throw new Error(`Invalid game duration ${durationMs}ms`);
    }
    let pool = this.words.findUnseenEnabledByDifficulty(difficulty);
    if (pool.length === 0) {
      // Every card has appeared — return them all to the pool and start over.
      this.words.resetSeen(difficulty);
      pool = this.words.findUnseenEnabledByDifficulty(difficulty);
    }
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

  /** Records that a card was shown, removing it from future decks until the pool resets. */
  markCardAppeared(wordId: number): void {
    this.words.markSeen(wordId);
  }

  /** Manually returns every card to the pool (one difficulty, or all). */
  resetCardPool(difficulty?: Difficulty): void {
    this.words.resetSeen(difficulty);
  }

  /** Persists a finished session for statistics. */
  recordResult(result: GameSessionResult): void {
    this.sessions.insert(result);
  }

  /** Discards a recorded game — it disappears from every leaderboard and stat. */
  discardResult(sessionId: string): void {
    this.sessions.deleteById(sessionId);
  }

  getStats(): GameStats {
    return this.sessions.getStats();
  }
}
