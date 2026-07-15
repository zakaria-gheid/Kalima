import type { Team, TeamStanding } from '@/domain/team';
import type { SqliteClient } from '@/infrastructure/db/database';

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

  /** All teams ranked by total points (cards won across all their games). */
  leaderboard(): TeamStanding[] {
    return this.client.query<TeamStanding>(
      `SELECT t.id AS teamId,
              t.describer,
              t.guesser,
              COALESCE(SUM(s.cards_completed), 0) AS totalPoints,
              COUNT(s.id) AS gamesPlayed
       FROM teams t
       LEFT JOIN game_sessions s ON s.team_id = t.id
       GROUP BY t.id
       ORDER BY totalPoints DESC, gamesPlayed ASC, t.describer COLLATE NOCASE`,
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
