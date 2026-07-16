import type { Difficulty } from '@/domain/word';
import type { GameSessionResult, GameStats } from '@/domain/gameSession';
import type { SqliteClient } from '@/infrastructure/db/database';

export class SessionRepository {
  constructor(private readonly client: SqliteClient) {}

  insert(result: GameSessionResult): void {
    this.client.run(
      `INSERT INTO game_sessions
         (id, difficulty, started_at, ended_at, duration_ms, elapsed_ms, cards_completed, cards_skipped, cards_total, team_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        result.id,
        result.difficulty,
        result.startedAt,
        result.endedAt,
        result.durationMs,
        result.elapsedMs,
        result.cardsCompleted,
        result.cardsSkipped,
        result.cardsTotal,
        result.team?.id ?? null,
      ],
    );
  }

  /** Discards a single recorded game so it no longer counts in any statistics. */
  deleteById(id: string): void {
    this.client.run('DELETE FROM game_sessions WHERE id = ?', [id]);
  }

  deleteAll(): void {
    this.client.run('DELETE FROM game_sessions');
  }

  /** Aggregate statistics — the architecture backing the future statistics dashboard. */
  getStats(): GameStats {
    const totals = this.client.query<{
      sessions: number;
      completed: number | null;
      playTime: number | null;
    }>(
      `SELECT COUNT(*) AS sessions,
              SUM(cards_completed) AS completed,
              SUM(elapsed_ms) AS playTime
       FROM game_sessions`,
    );
    const perDifficulty = this.client.query<{
      difficulty: Difficulty;
      sessions: number;
      completed: number;
    }>(
      `SELECT difficulty, COUNT(*) AS sessions, SUM(cards_completed) AS completed
       FROM game_sessions GROUP BY difficulty`,
    );

    const byDifficulty: GameStats['byDifficulty'] = {
      easy: { sessions: 0, cardsCompleted: 0 },
      medium: { sessions: 0, cardsCompleted: 0 },
      hard: { sessions: 0, cardsCompleted: 0 },
    };
    for (const row of perDifficulty) {
      byDifficulty[row.difficulty] = {
        sessions: row.sessions,
        cardsCompleted: row.completed,
      };
    }

    return {
      totalSessions: totals[0]?.sessions ?? 0,
      totalCardsCompleted: totals[0]?.completed ?? 0,
      totalPlayTimeMs: totals[0]?.playTime ?? 0,
      byDifficulty,
    };
  }
}
