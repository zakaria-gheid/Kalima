import initSqlJs, { type Database } from 'sql.js';
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url';
import seedRaw from '@assets/data/words_seed.txt?raw';
import { hintForCategory } from '@/lib/hints';
import { parseSeedFile } from '@/lib/seedParser';
import { parseWordHints } from '@/lib/wordHints';
import wordHintsRaw from '@assets/data/word_hints.txt?raw';
import { loadDatabaseBytes, saveDatabaseBytes } from './persistence';

const SCHEMA = `
CREATE TABLE IF NOT EXISTS words (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  english TEXT NOT NULL UNIQUE,
  arabic TEXT NOT NULL,
  category TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  enabled INTEGER NOT NULL DEFAULT 1,
  seen INTEGER NOT NULL DEFAULT 0,
  hint_en TEXT NOT NULL DEFAULT '',
  hint_ar TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_words_difficulty ON words (difficulty, enabled);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS teams (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  describer TEXT NOT NULL,
  guesser TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_teams_pair
  ON teams (describer COLLATE NOCASE, guesser COLLATE NOCASE);

CREATE TABLE IF NOT EXISTS game_sessions (
  id TEXT PRIMARY KEY,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  started_at INTEGER NOT NULL,
  ended_at INTEGER NOT NULL,
  duration_ms INTEGER NOT NULL DEFAULT 0,
  elapsed_ms INTEGER NOT NULL,
  cards_completed INTEGER NOT NULL,
  cards_skipped INTEGER NOT NULL,
  cards_total INTEGER NOT NULL,
  team_id INTEGER REFERENCES teams (id)
);
CREATE INDEX IF NOT EXISTS idx_sessions_started_at ON game_sessions (started_at);
`;

/**
 * Thin wrapper around the sql.js database: query helpers plus debounced
 * persistence to IndexedDB after every mutation.
 */
export class SqliteClient {
  private persistTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private readonly db: Database) {}

  /** Runs a SELECT and maps each row to an object keyed by column name. */
  query<T = Record<string, unknown>>(sql: string, params: unknown[] = []): T[] {
    const stmt = this.db.prepare(sql);
    try {
      stmt.bind(params as never[]);
      const rows: T[] = [];
      while (stmt.step()) {
        rows.push(stmt.getAsObject() as T);
      }
      return rows;
    } finally {
      stmt.free();
    }
  }

  /** Runs a mutating statement and schedules a persist. */
  run(sql: string, params: unknown[] = []): void {
    this.db.run(sql, params as never[]);
    this.schedulePersist();
  }

  /** Runs several mutations as one transaction, then persists. */
  transaction(fn: () => void): void {
    this.db.run('BEGIN TRANSACTION');
    try {
      fn();
      this.db.run('COMMIT');
    } catch (error) {
      this.db.run('ROLLBACK');
      throw error;
    }
    this.schedulePersist();
  }

  /** Statement used inside transaction(); does not persist by itself. */
  runInTransaction(sql: string, params: unknown[] = []): void {
    this.db.run(sql, params as never[]);
  }

  async persistNow(): Promise<void> {
    if (this.persistTimer !== null) {
      clearTimeout(this.persistTimer);
      this.persistTimer = null;
    }
    await saveDatabaseBytes(this.db.export());
  }

  private schedulePersist(): void {
    if (this.persistTimer !== null) clearTimeout(this.persistTimer);
    this.persistTimer = setTimeout(() => {
      this.persistTimer = null;
      void saveDatabaseBytes(this.db.export());
    }, 250);
  }
}

let clientPromise: Promise<SqliteClient> | null = null;

/** Opens (or creates and seeds) the local SQLite database. Idempotent. */
export function getSqliteClient(): Promise<SqliteClient> {
  clientPromise ??= initialize();
  return clientPromise;
}

async function initialize(): Promise<SqliteClient> {
  const SQL = await initSqlJs({ locateFile: () => wasmUrl });
  const existing = await loadDatabaseBytes();
  const db = existing ? new SQL.Database(existing) : new SQL.Database();
  const client = bootstrapClient(db);
  await client.persistNow();
  return client;
}

/** Applies the schema, migrations, and seed sync to an open database. */
export function bootstrapClient(db: Database): SqliteClient {
  const client = new SqliteClient(db);
  db.run(SCHEMA);
  applyMigrations(client);
  syncSeedWords(client);
  backfillHints(client);
  applyWordHints(client);
  return client;
}

/**
 * Overrides the generic category hints with word-specific ones from
 * assets/data/word_hints.txt. Version-gated so the (large) update only runs
 * when the hints file actually changes — bump WORD_HINTS_VERSION with it.
 */
const WORD_HINTS_VERSION_KEY = 'wordHintsVersion';
const WORD_HINTS_VERSION = '3';

function applyWordHints(client: SqliteClient): void {
  const [stored] = client.query<{ value: string }>(
    'SELECT value FROM settings WHERE key = ?',
    [WORD_HINTS_VERSION_KEY],
  );
  if (stored?.value === WORD_HINTS_VERSION) return;

  const entries = parseWordHints(wordHintsRaw);
  client.transaction(() => {
    for (const entry of entries) {
      client.runInTransaction(
        'UPDATE words SET hint_en = ?, hint_ar = ? WHERE english = ? COLLATE NOCASE',
        [entry.hintEn, entry.hintAr, entry.english],
      );
    }
    client.runInTransaction(
      'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
      [WORD_HINTS_VERSION_KEY, WORD_HINTS_VERSION],
    );
  });
}

/** Fills the per-word describer hints (both languages) for any word missing them. */
function backfillHints(client: SqliteClient): void {
  const categories = client.query<{ category: string }>(
    "SELECT DISTINCT category FROM words WHERE hint_en = '' OR hint_ar = ''",
  );
  if (categories.length === 0) return;
  client.transaction(() => {
    for (const { category } of categories) {
      client.runInTransaction(
        "UPDATE words SET hint_en = ?, hint_ar = ? WHERE category = ? AND (hint_en = '' OR hint_ar = '')",
        [hintForCategory(category, 'en'), hintForCategory(category, 'ar'), category],
      );
    }
  });
}

/** Upgrades databases created by earlier app versions (CREATE TABLE IF NOT EXISTS won't add columns). */
function applyMigrations(client: SqliteClient): void {
  const columns = client.query<{ name: string }>('PRAGMA table_info(game_sessions)');
  if (!columns.some((column) => column.name === 'duration_ms')) {
    client.run('ALTER TABLE game_sessions ADD COLUMN duration_ms INTEGER NOT NULL DEFAULT 0');
  }
  if (!columns.some((column) => column.name === 'team_id')) {
    client.run('ALTER TABLE game_sessions ADD COLUMN team_id INTEGER REFERENCES teams (id)');
  }
  const wordColumns = client.query<{ name: string }>('PRAGMA table_info(words)');
  if (!wordColumns.some((column) => column.name === 'seen')) {
    client.run('ALTER TABLE words ADD COLUMN seen INTEGER NOT NULL DEFAULT 0');
  }
  if (!wordColumns.some((column) => column.name === 'hint_en')) {
    client.run("ALTER TABLE words ADD COLUMN hint_en TEXT NOT NULL DEFAULT ''");
    client.run("ALTER TABLE words ADD COLUMN hint_ar TEXT NOT NULL DEFAULT ''");
  }
  // Indexes on migrated columns must be created here, after the columns exist —
  // putting them in SCHEMA breaks startup for databases from older app versions.
  client.run('CREATE INDEX IF NOT EXISTS idx_sessions_team ON game_sessions (team_id)');
}

/**
 * Imports every seed word from assets/data/words_seed.txt that is not yet in
 * the words table (matched case-insensitively on English). Seeds everything
 * on first run and picks up newly added seed words on upgrades, without
 * touching existing rows or their enabled flags.
 */
function syncSeedWords(client: SqliteClient): void {
  const existing = new Set(
    client
      .query<{ english: string }>('SELECT english FROM words')
      .map((row) => row.english.toLowerCase()),
  );
  const missing = parseSeedFile(seedRaw).filter(
    (word) => !existing.has(word.english.toLowerCase()),
  );
  if (missing.length === 0) return;

  const now = Date.now();
  client.transaction(() => {
    for (const word of missing) {
      client.runInTransaction(
        'INSERT INTO words (english, arabic, category, difficulty, enabled, created_at) VALUES (?, ?, ?, ?, 1, ?)',
        [word.english, word.arabic, word.category, word.difficulty, now],
      );
    }
  });
}
