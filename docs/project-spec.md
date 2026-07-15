# Kalima (Family Hotseat) — Project Specification

An offline-first, cross-platform English ↔ Arabic vocabulary game for families.
One player explains a word, another guesses it. No accounts, no servers, no
internet required.

**Brand:** the app ships as **Kalima** (كلمة, Arabic for "word"); *Family
Hotseat* remains the internal project codename used in module and package
names. The icon is two overlapping speech bubbles — Latin "A" and Arabic "ك" —
on a blue→violet gradient.

## 1. Product Overview

- **Platforms:** Web (PWA), Android and iOS (Capacitor shells around the same web app).
- **Audience:** Families playing together on one device ("hotseat" style).
- **Offline-first:** No backend server, no auth, no network calls, no cloud sync. All data lives locally in SQLite.

## 2. Game Rules

1. From Home, the player chooses **Start Game**, then enters the **team** — the name of the **describer** (who explains the word) and the **guesser** (who answers). The last team is prefilled and a swap button flips the roles. Roles matter: A→B and B→A are distinct teams. Then a **round length** (1 / 2 / 3 / 5 minutes — the last choice is remembered) and a difficulty: Easy 🟢, Medium 🟡, or Hard 🔴.
2. A deck is built from the **no-repeat pool**: every enabled word of that difficulty that has **not yet appeared in any game**, shuffled **once** with **Fisher–Yates** (order is always random). Cards never repeat within a session, and a card shown in any game stays out of later games until the whole pool has been played — then the pool **resets automatically**. The New game page shows how many cards are left per difficulty and offers a **Reset card pool** button to reset manually.
3. A **countdown timer** (MM:SS) starts from the chosen round length when the game starts. It supports **pause / resume**; the card is hidden while paused. The last 10 seconds are highlighted.
4. For each card the group plays the word; the holder marks it **Got it!** (completed) or **Skip**. A live counter of words got is always visible.
5. The session ends when the countdown reaches zero, the deck is exhausted, or the player ends early.
6. The **Completion screen** shows the team, the points won (+cards completed), time played (out of the round length) and skips, with Play Again / Leaderboard / Home. When the countdown ran out it reads "Time's up!".
7. The **Leaderboard** page ranks all teams best-first by total points (sum of cards won across their games), with games played as context and medals for the top three.

## 3. Word Data

- Seed source of truth: **`assets/data/words_seed.txt`** — UTF-8, pipe-delimited, header `english|arabic|category|difficulty`.
- Exactly **1600 concrete nouns**: 300 easy, 1000 medium, 300 hard, across 21 categories. No duplicate English words. Difficulties are lowercase.
- Synced into the `words` table (`enabled = true`) on every start: words missing from the database are imported (case-insensitive English match); existing rows and their enabled flags are never touched. Word lists are never hardcoded in source.
- The **Word List** screen offers search (English or Arabic), difficulty/category filters, and per-word enable/disable. Disabled words are excluded from new decks.

## 4. Architecture

Clean Architecture, strictly layered; business logic never lives in React components.

```
Presentation   pages/ components/ layouts/ hooks/        (React)
  → Application   GameService, WordService, SettingsService, TimerService
    → Domain        Word, GameSession, Difficulty, Category, Settings
      → Infrastructure  SQLite (sql.js in the app, GORM in Go), repositories
```

### Frontend (`frontend/`)

- React 19 + TypeScript (`strict: true`), Vite, TailwindCSS 4, Framer Motion, Zustand, TanStack Query, React Router (hash routing for `file://` webviews), React Hook Form, Heroicons.
- **SQLite in the browser:** sql.js (SQLite compiled to WASM), bundled locally so the app works fully offline. The database file is persisted to IndexedDB after every mutation; on Capacitor the same engine runs inside the webview.
- Repository pattern (`WordRepository`, `SessionRepository`, `SettingsRepository`) behind application services; components reach services only through hooks/stores.
- PWA via `vite-plugin-pwa`: service worker precaches all assets including the WASM binary.

### Local services (`backend/`)

- Go with GORM (pure-Go SQLite driver — no cgo) implementing the same Clean Architecture: `internal/domain` (entities + repository ports), `internal/application` (seed parsing, Fisher–Yates, game/word services), `internal/infrastructure/persistence` (GORM adapters).
- **No REST API, no network.** The Go layer is tooling and reference implementation; `cmd/seed` builds `database/hotseat.db` from the seed file (idempotent, `-force` to reseed).

### Database schema

```sql
words(id, english UNIQUE, arabic, category, difficulty CHECK(easy|medium|hard), enabled, seen, created_at)
settings(key PRIMARY KEY, value)
teams(id, describer, guesser, created_at, UNIQUE(describer, guesser) COLLATE NOCASE)
game_sessions(id, difficulty, started_at, ended_at, duration_ms, elapsed_ms,
              cards_completed, cards_skipped, cards_total, team_id → teams)
```

`game_sessions` exists from day one so a statistics dashboard can ship later without a migration.

## 5. UI / UX

- Mobile-first, Material Design 3 inspired: rounded cards (24 px), soft shadows.
- Colors: Easy `#22C55E`, Medium `#EAB308`, Hard `#EF4444`, Primary `#2563EB`, Light bg `#F8FAFC`, Dark bg `#111827`.
- Card typography: English ≥ 48 px (LTR, `lang="en"`), Arabic ≥ 40 px (RTL, `lang="ar"`), both rendered correctly in the same view.
- Accessibility: touch targets ≥ 48×48 px, keyboard navigable, visible focus rings, ARIA roles (timer, progressbar, radiogroup), screen-reader labels.
- Themes: Light / Dark / System, persisted in the settings table.
- Animations via Framer Motion; the **Reduce Animations** setting (and the OS `prefers-reduced-motion`) disables them.

## 6. Testing

- **Required unit tests:** Fisher–Yates shuffle (permutation, no mutation, determinism with an injected RNG, uniformity) and timer logic (start/pause/resume/reset, exact accounting with an injected clock, MM:SS formatting) — implemented in both TypeScript (Vitest) and Go.
- Seed parser tests validate the real seed file (300 rows, 100 per difficulty) in both stacks.
- Go integration tests run the seed → query → deck → record-session round trip against in-memory SQLite.

## 7. Extensibility

Designed so these can be added without major refactoring: card images, audio
pronunciation, favorites, multiplayer, daily challenges, custom words, SQLite
import/export, statistics dashboard (session recording already ships), and
mixed-difficulty mode.

## 8. Definition of Done

Works fully offline · compiles and runs without manual fixes · tests pass ·
responsive (mobile/tablet/desktop) · accessible · dark mode · RTL correct ·
Docker dev env (`docker compose up`) · GitHub Actions CI green.
