import type { PlayerStanding, Team, TeamStanding } from '@/domain/team';
import type { SqliteClient } from '@/infrastructure/db/database';

/**
 * Fair ranking across different game counts: points per game first (so a
 * 2-game team is never buried under a 10-game team's raw total), more games
 * as the tie-breaker, then total points.
 */
function rank<T extends { avgPoints: number; gamesPlayed: number; totalPoints: number }>(
  rows: T[],
): T[] {
  return rows.sort(
    (a, b) =>
      b.avgPoints - a.avgPoints ||
      b.gamesPlayed - a.gamesPlayed ||
      b.totalPoints - a.totalPoints,
  );
}

interface TeamRow {
  id: number;
  describer: string;
  guesser: string;
}

export class TeamRepository {
  constructor(private readonly client: SqliteClient) {}

  /**
   * Returns the existing team for this describer/guesser pair
   * (case-insensitive) or creates it. Roles matter: A describes / B guesses
   * is a different team than the reverse.
   */
  findOrCreate(describer: string, guesser: string): Team {
    const existing = this.find(describer, guesser);
    if (existing) return existing;
    this.client.run('INSERT INTO teams (describer, guesser, created_at) VALUES (?, ?, ?)', [
      describer,
      guesser,
      Date.now(),
    ]);
    const created = this.find(describer, guesser);
    if (!created) throw new Error('Team insert did not persist');
    return created;
  }

  /** All teams that played, ranked fairly (points per game, then games, then total). */
  leaderboard(): TeamStanding[] {
    const rows = this.client.query<Omit<TeamStanding, 'avgPoints'>>(
      `SELECT t.id AS teamId,
              t.describer,
              t.guesser,
              COALESCE(SUM(s.cards_completed), 0) AS totalPoints,
              COUNT(s.id) AS gamesPlayed
       FROM teams t
       JOIN game_sessions s ON s.team_id = t.id
       GROUP BY t.id`,
    );
    return rank(
      rows.map((row) => ({
        ...row,
        avgPoints: row.gamesPlayed > 0 ? row.totalPoints / row.gamesPlayed : 0,
      })),
    );
  }

  /** Individual ranking for one role: 'describer' or 'guesser' (case-insensitive by name). */
  playerStandings(role: 'describer' | 'guesser'): PlayerStanding[] {
    const column = role === 'describer' ? 't.describer' : 't.guesser';
    const rows = this.client.query<Omit<PlayerStanding, 'avgPoints'>>(
      `SELECT ${column} AS name,
              COALESCE(SUM(s.cards_completed), 0) AS totalPoints,
              COUNT(s.id) AS gamesPlayed
       FROM teams t
       JOIN game_sessions s ON s.team_id = t.id
       GROUP BY ${column} COLLATE NOCASE`,
    );
    return rank(
      rows.map((row) => ({
        ...row,
        avgPoints: row.gamesPlayed > 0 ? row.totalPoints / row.gamesPlayed : 0,
      })),
    );
  }

  deleteAll(): void {
    this.client.run('DELETE FROM teams');
  }

  private find(describer: string, guesser: string): Team | null {
    const rows = this.client.query<TeamRow>(
      `SELECT id, describer, guesser FROM teams
       WHERE describer = ? COLLATE NOCASE AND guesser = ? COLLATE NOCASE`,
      [describer, guesser],
    );
    return rows[0] ?? null;
  }
}
