import { createRequire } from 'node:module';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import initSqlJs from 'sql.js';
import { bootstrapClient, type SqliteClient } from './database';
import { WordRepository } from '@/infrastructure/repositories/wordRepository';
import { SessionRepository } from '@/infrastructure/repositories/sessionRepository';
import { SettingsRepository } from '@/infrastructure/repositories/settingsRepository';
import { TeamRepository } from '@/infrastructure/repositories/teamRepository';
import { GameService } from '@/application/gameService';
import { SettingsService } from '@/application/settingsService';
import { TeamService } from '@/application/teamService';

// IndexedDB does not exist in Node; persistence is exercised in the browser only.
vi.mock('./persistence', () => ({
  loadDatabaseBytes: async () => null,
  saveDatabaseBytes: async () => {},
}));

const require = createRequire(import.meta.url);

let client: SqliteClient;
let words: WordRepository;

beforeAll(async () => {
  const SQL = await initSqlJs({
    locateFile: () => require.resolve('sql.js/dist/sql-wasm.wasm'),
  });
  client = bootstrapClient(new SQL.Database());
  words = new WordRepository(client);
});

describe('database bootstrap (real seed file, real schema)', () => {
  it('seeds exactly 2300 words: 1000 easy, 1000 medium, 300 hard, all enabled', () => {
    expect(words.findAll()).toHaveLength(2300);
    expect(words.countByDifficulty()).toEqual({ easy: 1000, medium: 1000, hard: 300 });
    expect(words.findAll({ enabledOnly: true })).toHaveLength(2300);
  });

  it('preserves Arabic text exactly (UTF-8 round trip through SQLite)', () => {
    const chair = words.findAll({ search: 'Chair' }).find((w) => w.english === 'Chair');
    expect(chair?.arabic).toBe('كرسي');
  });

  it('searches by English and Arabic and filters by category', () => {
    expect(words.findAll({ search: 'كرسي' }).some((w) => w.english === 'Chair')).toBe(true);
    const categories = words.listCategories();
    expect(categories.length).toBeGreaterThanOrEqual(10);
    const firstCategory = categories[0];
    expect(firstCategory).toBeDefined();
    const inCategory = words.findAll({ category: firstCategory });
    expect(inCategory.length).toBeGreaterThan(0);
    expect(inCategory.every((w) => w.category === firstCategory)).toBe(true);
  });

  it('disabling a word removes it from new decks', () => {
    const pool = words.findEnabledByDifficulty('easy');
    const first = pool[0];
    expect(first).toBeDefined();
    words.setEnabled(first!.id, false);
    const after = words.findEnabledByDifficulty('easy');
    expect(after).toHaveLength(pool.length - 1);
    expect(after.some((w) => w.id === first!.id)).toBe(false);
    words.setEnabled(first!.id, true);
  });
});

describe('GameService (full flow against the seeded database)', () => {
  it('creates a 300-card shuffled deck with zero repeats, then records the result for a team', () => {
    const sessions = new SessionRepository(client);
    const teams = new TeamRepository(client);
    const game = new GameService(words, sessions);
    const team = teams.findOrCreate('Ali', 'Sara');

    const session = game.createSession('medium', 120_000, team);
    expect(session.deck).toHaveLength(1000);
    expect(new Set(session.deck.map((w) => w.id)).size).toBe(1000);
    expect(session.deck.every((w) => w.difficulty === 'medium')).toBe(true);
    expect(session.durationMs).toBe(120_000);
    expect(session.team).toEqual(team);
    expect(() => game.createSession('medium', 0, team)).toThrow(/duration/i);

    game.recordResult({
      id: session.id,
      difficulty: session.difficulty,
      startedAt: session.startedAt,
      endedAt: session.startedAt + 90_000,
      durationMs: session.durationMs,
      elapsedMs: 90_000,
      cardsCompleted: 42,
      cardsSkipped: 3,
      cardsTotal: 100,
      team: session.team,
    });

    const stats = game.getStats();
    expect(stats.totalSessions).toBe(1);
    expect(stats.totalCardsCompleted).toBe(42);
    expect(stats.totalPlayTimeMs).toBe(90_000);
    expect(stats.byDifficulty.medium).toEqual({ sessions: 1, cardsCompleted: 42 });
  });
});

describe('no-repeat card pool', () => {
  it('appeared cards stay out of new decks until the pool is exhausted, then it resets', () => {
    const sessions = new SessionRepository(client);
    const teams = new TeamRepository(client);
    const game = new GameService(words, sessions);
    const team = teams.findOrCreate('Pool', 'Tester');
    game.resetCardPool();

    const total = words.findEnabledByDifficulty('easy').length;

    // Play through some cards in a first game.
    const first = game.createSession('easy', 60_000, team);
    const played = first.deck.slice(0, 10);
    for (const card of played) game.markCardAppeared(card.id);
    expect(words.countUnseenByDifficulty().easy).toBe(total - 10);

    // The next deck excludes every card that already appeared.
    const second = game.createSession('easy', 60_000, team);
    expect(second.deck).toHaveLength(total - 10);
    const playedIds = new Set(played.map((w) => w.id));
    expect(second.deck.some((w) => playedIds.has(w.id))).toBe(false);

    // Exhaust the pool: the next session auto-resets and serves everything again.
    for (const card of second.deck) game.markCardAppeared(card.id);
    expect(words.countUnseenByDifficulty().easy).toBe(0);
    const third = game.createSession('easy', 60_000, team);
    expect(third.deck).toHaveLength(total);

    // Only the exhausted difficulty resets; others are untouched.
    game.markCardAppeared(third.deck[0]!.id);
    expect(words.countUnseenByDifficulty().easy).toBe(total - 1);

    // Manual reset returns every card to the pool.
    game.resetCardPool();
    expect(words.countUnseenByDifficulty().easy).toBe(total);
  });
});

describe('migration from a v1 database (pre-countdown, pre-teams schema)', () => {
  it('upgrades in place without losing data and accepts new-format sessions', async () => {
    const SQL = await initSqlJs({
      locateFile: () => require.resolve('sql.js/dist/sql-wasm.wasm'),
    });
    const oldDb = new SQL.Database();
    // The exact schema shipped in the first version, plus some existing data.
    oldDb.run(`
      CREATE TABLE words (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        english TEXT NOT NULL UNIQUE,
        arabic TEXT NOT NULL,
        category TEXT NOT NULL,
        difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
        enabled INTEGER NOT NULL DEFAULT 1,
        created_at INTEGER NOT NULL
      );
      CREATE TABLE settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
      CREATE TABLE game_sessions (
        id TEXT PRIMARY KEY,
        difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
        started_at INTEGER NOT NULL,
        ended_at INTEGER NOT NULL,
        elapsed_ms INTEGER NOT NULL,
        cards_completed INTEGER NOT NULL,
        cards_skipped INTEGER NOT NULL,
        cards_total INTEGER NOT NULL
      );
      INSERT INTO words (english, arabic, category, difficulty, enabled, created_at)
        VALUES ('Chair', 'كرسي', 'Home', 'easy', 1, 1);
      INSERT INTO game_sessions VALUES ('legacy', 'easy', 1, 2, 60000, 5, 1, 100);
      INSERT INTO settings VALUES ('theme', 'dark');
    `);

    // Must not throw "no such column: team_id" (startup regression).
    const upgraded = bootstrapClient(oldDb);

    const sessionColumns = upgraded
      .query<{ name: string }>('PRAGMA table_info(game_sessions)')
      .map((column) => column.name);
    expect(sessionColumns).toContain('duration_ms');
    expect(sessionColumns).toContain('team_id');

    // Existing data survives, and the seed sync imports every word the old
    // database was missing (Chair already existed, so 2299 are added).
    const oldWords = new WordRepository(upgraded);
    expect(oldWords.findAll()).toHaveLength(2300);
    expect(oldWords.findAll({ search: 'Chair' }).filter((w) => w.english === 'Chair')).toHaveLength(
      1,
    );
    const [legacy] = upgraded.query<{ cards_completed: number; team_id: number | null }>(
      'SELECT cards_completed, team_id FROM game_sessions WHERE id = ?',
      ['legacy'],
    );
    expect(legacy).toMatchObject({ cards_completed: 5, team_id: null });
    expect(new SettingsRepository(upgraded).get('theme')).toBe('dark');

    // New-format sessions with teams work on the upgraded database.
    const team = new TeamRepository(upgraded).findOrCreate('Nour', 'Zed');
    new SessionRepository(upgraded).insert({
      id: 'new',
      difficulty: 'easy',
      startedAt: 3,
      endedAt: 4,
      durationMs: 60_000,
      elapsedMs: 60_000,
      cardsCompleted: 9,
      cardsSkipped: 0,
      cardsTotal: 100,
      team,
    });
    const standings = new TeamRepository(upgraded).leaderboard();
    expect(standings).toContainEqual(
      expect.objectContaining({ teamId: team.id, totalPoints: 9 }),
    );
  });
});

describe('Teams and leaderboard', () => {
  it('dedupes teams case-insensitively, keeps swapped roles distinct, ranks by points', () => {
    const teams = new TeamRepository(client);
    const sessions = new SessionRepository(client);
    const service = new TeamService(teams, sessions, new SettingsRepository(client));

    const ali = service.getOrCreate({ describer: '  Omar ', guesser: 'Lina' });
    const same = service.getOrCreate({ describer: 'omar', guesser: 'LINA' });
    expect(same.id).toBe(ali.id);
    const swapped = service.getOrCreate({ describer: 'Lina', guesser: 'Omar' });
    expect(swapped.id).not.toBe(ali.id);
    expect(() => service.getOrCreate({ describer: ' ', guesser: 'Lina' })).toThrow(/required/i);

    // getOrCreate remembers the last team for the next game's prefill.
    expect(service.lastTeam()).toEqual({ describer: 'Lina', guesser: 'Omar' });

    const record = (id: string, teamId: number, points: number) => {
      sessions.insert({
        id,
        difficulty: 'easy',
        startedAt: 1,
        endedAt: 2,
        durationMs: 60_000,
        elapsedMs: 60_000,
        cardsCompleted: points,
        cardsSkipped: 0,
        cardsTotal: 100,
        team: { id: teamId, describer: '', guesser: '' },
      });
    };
    record('t1', ali.id, 7);
    record('t2', ali.id, 8);
    record('t3', swapped.id, 30);

    const standings = service.leaderboard();
    const ours = standings.filter((s) => s.teamId === ali.id || s.teamId === swapped.id);
    expect(ours[0]).toMatchObject({ teamId: swapped.id, totalPoints: 30, gamesPlayed: 1 });
    expect(ours[1]).toMatchObject({ teamId: ali.id, totalPoints: 15, gamesPlayed: 2 });
  });

  it('clearLeaderboard erases all results but keeps the last-team prefill', () => {
    const teams = new TeamRepository(client);
    const sessions = new SessionRepository(client);
    const service = new TeamService(teams, sessions, new SettingsRepository(client));

    expect(service.leaderboard().length).toBeGreaterThan(0);
    const lastBefore = service.lastTeam();

    service.clearLeaderboard();

    expect(service.leaderboard()).toEqual([]);
    // The next-game form should still be prefilled with the last players.
    expect(service.lastTeam()).toEqual(lastBefore);
    // And a fresh game can be recorded normally afterwards.
    const team = service.getOrCreate({ describer: 'Rami', guesser: 'Dina' });
    sessions.insert({
      id: 'after-clear',
      difficulty: 'easy',
      startedAt: 1,
      endedAt: 2,
      durationMs: 60_000,
      elapsedMs: 60_000,
      cardsCompleted: 4,
      cardsSkipped: 0,
      cardsTotal: 100,
      team,
    });
    expect(service.leaderboard()).toEqual([
      expect.objectContaining({ teamId: team.id, totalPoints: 4, gamesPlayed: 1 }),
    ]);
  });
});

describe('SettingsService', () => {
  it('persists and reloads theme, animations, duration, and sound settings', () => {
    const service = new SettingsService(new SettingsRepository(client));
    expect(service.load()).toEqual({
      theme: 'system',
      reduceAnimations: false,
      gameDurationSec: 180,
      tickSound: true,
      soundEffects: true,
      vibration: true,
      endAlert: true,
    });
    service.setTheme('dark');
    service.setReduceAnimations(true);
    service.setGameDurationSec(60);
    service.setTickSound(false);
    service.setSoundEffects(false);
    service.setVibration(false);
    service.setEndAlert(false);
    expect(service.load()).toEqual({
      theme: 'dark',
      reduceAnimations: true,
      gameDurationSec: 60,
      tickSound: false,
      soundEffects: false,
      vibration: false,
      endAlert: false,
    });
  });
});
