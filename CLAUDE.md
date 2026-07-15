# CLAUDE.md — Kalima (codename: Family Hotseat)

The app is branded **Kalima** (كلمة) in all user-facing surfaces (UI, manifest, store listings); internal identifiers (packages, modules, paths) keep the codename `hotseat`.

Instructions for AI assistants working on this codebase. Full specification: `docs/project-spec.md` — read it before large features.

## What This Is

Offline-first English↔Arabic vocabulary game (Hotseat style). Web PWA + Android + iOS via Capacitor. **No backend server, no auth, no network calls, no cloud sync.** All data local (SQLite).

## Stack (do not deviate)

- **Frontend:** React 19 + TypeScript strict, Vite, TailwindCSS, Framer Motion, Zustand, TanStack Query, React Router, React Hook Form, Heroicons
- **Local services:** Go — SQLite access, repositories, services only. No REST API.
- **DB:** SQLite at `database/hotseat.db`, GORM or sqlc
- **Mobile:** Capacitor

## Architecture Rules

Clean Architecture, strictly layered:

```
Presentation (pages/components/layouts/hooks)
  → Application (GameService, WordService, SettingsService, TimerService)
    → Domain (Word, GameSession, Difficulty, Category)
      → Infrastructure (SQLite, repositories, persistence)
```

- **Business logic never lives in React components.** Components call services via hooks.
- Repository pattern + service layer everywhere.
- Functional components + hooks only. No class components.

## Coding Standards

- SOLID, DRY, KISS
- TypeScript `strict: true`
- **No TODOs, no placeholder implementations, no mock data** outside the SQLite seed
- Unit tests required for shuffle (Fisher–Yates) and timer logic

## Key Behaviors

- **Shuffle:** Fisher–Yates, deck shuffled once per session, zero repeats within a session
- **No-repeat pool:** a card shown in any game stays out of later decks (`words.seen`) until every card of that difficulty has appeared, then the pool resets automatically; a "Reset card pool" button on the New game page resets manually. Order stays random.
- **Timer:** countdown (compte à rebours) rendered as a prominent circular ring, MM:SS, round length selectable before starting (1/2/3/5 min, persisted); start/pause/resume/reset; the game ends when it reaches zero (alarm sound + long vibration, toggleable)
- **Skip cost:** skipping burns **10% of the round length** off the clock (no points): the timer flashes red, a buzz plays, and a "−Ns" animation flies off the ring. If the time left is ≤ the cost, the skip cannot be paid — the round just ends.
- **Sound & haptics:** clock tick each second, correct-answer chime, skip buzz + vibration, timer-end alarm + long vibration — all synthesized via Web Audio (offline), each gated by its own Settings toggle (Clock tick / Sound effects / Vibration / Timer end alert).
- **Teams:** every game is played by a team of two named players — a **describer** and a **guesser** (roles matter; swapped roles = a different team). Cards won = points, accumulated per team in SQLite; the **Leaderboard** page ranks teams best-first by total points.
- **Game flow:** Home → New game (team names + round length + level) → Game (countdown + live "got it" counter + who describes/guesses) → Completion (time played, cards completed, team points) → Leaderboard
- **Seed:** exactly 2300 concrete nouns (1000 easy / 1000 medium / 300 hard), synced on every start — missing seed words are imported without touching existing rows

## Seed Data Source

The word list lives at **`assets/data/words_seed.txt`** — pipe-delimited with header:

```
english|arabic|category|difficulty
Chair|كرسي|Home|easy
```

- **This file is the single source of truth for seed data.** The seeding script/migration must parse this file and insert rows into the `words` table (with `enabled = true`). Do not hardcode word lists in source code.
- The file is complete and validated: exactly 1000 easy + 1000 medium + 300 hard, no duplicate English words, all rows have 4 fields. **Import it verbatim — do not invent, replace, or regenerate words.**
- Difficulty values must remain lowercase: `easy`, `medium`, `hard`.
- Encoding is UTF-8; preserve Arabic text exactly.

## UI Conventions

- Mobile-first, Material Design 3 inspired, rounded cards (24px radius), soft shadows
- Colors: Easy `#22C55E`, Medium `#EAB308`, Hard `#EF4444`, Primary `#2563EB`, Light bg `#F8FAFC`, Dark bg `#111827`
- Card typography: English ≥48px, Arabic ≥40px
- **Arabic = RTL, English = LTR** — both must render correctly in the same view
- Touch targets ≥48×48px, keyboard navigable, screen-reader friendly
- Themes: Light / Dark / System, persisted locally
- Animations via Framer Motion; respect "Reduce Animations" setting

## Extensibility

Design so these can be added **without major refactoring:** card images, audio pronunciation, favorites, multiplayer, daily challenges, custom words, SQLite import/export, statistics dashboard, mixed-difficulty mode. Statistics architecture should exist even before the feature ships.

## Definition of Done

Works fully offline · compiles and runs without manual fixes · tests pass · responsive (mobile/tablet/desktop) · accessible · dark mode · RTL correct · Docker dev env · GitHub Actions CI green.
