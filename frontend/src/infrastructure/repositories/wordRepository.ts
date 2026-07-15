import type { Category, Difficulty, Word, WordFilter } from '@/domain/word';
import type { SqliteClient } from '@/infrastructure/db/database';

interface WordRow {
  id: number;
  english: string;
  arabic: string;
  category: string;
  difficulty: Difficulty;
  enabled: number;
}

function toWord(row: WordRow): Word {
  return {
    id: row.id,
    english: row.english,
    arabic: row.arabic,
    category: row.category,
    difficulty: row.difficulty,
    enabled: row.enabled === 1,
  };
}

export class WordRepository {
  constructor(private readonly client: SqliteClient) {}

  findAll(filter: WordFilter = {}): Word[] {
    const clauses: string[] = [];
    const params: unknown[] = [];

    if (filter.search) {
      clauses.push('(english LIKE ? COLLATE NOCASE OR arabic LIKE ?)');
      const pattern = `%${filter.search}%`;
      params.push(pattern, pattern);
    }
    if (filter.difficulty) {
      clauses.push('difficulty = ?');
      params.push(filter.difficulty);
    }
    if (filter.category) {
      clauses.push('category = ?');
      params.push(filter.category);
    }
    if (filter.enabledOnly) {
      clauses.push('enabled = 1');
    }

    const where = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
    const rows = this.client.query<WordRow>(
      `SELECT id, english, arabic, category, difficulty, enabled
       FROM words ${where}
       ORDER BY english COLLATE NOCASE`,
      params,
    );
    return rows.map(toWord);
  }

  findEnabledByDifficulty(difficulty: Difficulty): Word[] {
    return this.findAll({ difficulty, enabledOnly: true });
  }

  /** Enabled words of the difficulty that have not yet appeared in any game. */
  findUnseenEnabledByDifficulty(difficulty: Difficulty): Word[] {
    const rows = this.client.query<WordRow>(
      `SELECT id, english, arabic, category, difficulty, enabled
       FROM words WHERE difficulty = ? AND enabled = 1 AND seen = 0`,
      [difficulty],
    );
    return rows.map(toWord);
  }

  /** Marks a word as having appeared; it stays out of new decks until the pool resets. */
  markSeen(id: number): void {
    this.client.run('UPDATE words SET seen = 1 WHERE id = ?', [id]);
  }

  /** Returns every word of the difficulty to the pool of cards that can appear. */
  resetSeen(difficulty?: Difficulty): void {
    if (difficulty) {
      this.client.run('UPDATE words SET seen = 0 WHERE difficulty = ?', [difficulty]);
    } else {
      this.client.run('UPDATE words SET seen = 0');
    }
  }

  countByDifficulty(): Record<Difficulty, number> {
    const rows = this.client.query<{ difficulty: Difficulty; n: number }>(
      'SELECT difficulty, COUNT(*) AS n FROM words WHERE enabled = 1 GROUP BY difficulty',
    );
    const counts: Record<Difficulty, number> = { easy: 0, medium: 0, hard: 0 };
    for (const row of rows) counts[row.difficulty] = row.n;
    return counts;
  }

  /** Enabled words per difficulty that have not appeared yet (the remaining pool). */
  countUnseenByDifficulty(): Record<Difficulty, number> {
    const rows = this.client.query<{ difficulty: Difficulty; n: number }>(
      'SELECT difficulty, COUNT(*) AS n FROM words WHERE enabled = 1 AND seen = 0 GROUP BY difficulty',
    );
    const counts: Record<Difficulty, number> = { easy: 0, medium: 0, hard: 0 };
    for (const row of rows) counts[row.difficulty] = row.n;
    return counts;
  }

  listCategories(): Category[] {
    return this.client
      .query<{ category: string }>('SELECT DISTINCT category FROM words ORDER BY category')
      .map((row) => row.category);
  }

  setEnabled(id: number, enabled: boolean): void {
    this.client.run('UPDATE words SET enabled = ? WHERE id = ?', [enabled ? 1 : 0, id]);
  }
}
