# Kalima — كلمة

**Learn English While Playing** — An offline-first, cross-platform English ↔ Arabic word game for families. *Kalima* is Arabic for "word". (Project codename: Family Hotseat.)

One player explains a word, another guesses it. No accounts, no servers, no internet required.

## Platforms

- 🌐 Web (Progressive Web App)
- 🤖 Android (via Capacitor)
- 🍎 iOS (via Capacitor)

## Features

- 1600 seeded English–Arabic noun cards (300 easy / 1000 medium / 300 hard) across 21 categories
- No-repeat card pool: a card that appeared in any game stays out of new games until all cards have been played (auto reset, plus a manual reset button)
- Three difficulty levels: Easy 🟢 / Medium 🟡 / Hard 🔴
- Team play: a **describer** and a **guesser** per team, with points (cards won) and a ranked leaderboard
- Countdown rounds (1–5 minutes, selectable) shown as a circular ring timer, with pause/resume and a live "got it" counter
- Skips cost time, not points: −10% of the round per skip, with a red flash, buzz, and "−Ns" animation; a skip that can't be paid ends the round
- Sound & haptics (all toggleable): clock tick, correct chime, skip buzz + vibration, timer-end alarm + long vibration
- Fisher–Yates shuffled decks — no repeated cards per session
- Searchable, filterable word list
- Light / Dark / System themes
- Full RTL support for Arabic, LTR for English
- Accessible: high contrast, 48×48px touch targets, keyboard navigation, screen-reader friendly

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript (strict), Vite, TailwindCSS, Framer Motion, Zustand, TanStack Query, React Router, React Hook Form |
| Local services | Go (Clean Architecture — no REST, no network) |
| Database | SQLite (auto-seeded) |
| Mobile shell | Capacitor |

## Project Structure

```
frontend/        React app (components, pages, hooks, services, store)
backend/         Go local services (repositories, services, models)
database/        hotseat.db + migrations
assets/data/     Seed word list (words_seed.txt)
docs/            Full project specification
```

## Seed Data

The vocabulary database is seeded from `assets/data/words_seed.txt`, a pipe-delimited file (`english|arabic|category|difficulty`) containing exactly 1600 words — 300 easy, 1000 medium, 300 hard — across 21 categories. The database syncs from this file on every start: words missing from the database are imported, existing rows are left untouched. To add words, edit the file and restart.

## Getting Started

```bash
# Development (Docker)
docker compose up

# Or locally
cd frontend && npm install && npm run dev
```

### Mobile builds

```bash
npx cap sync
npx cap open android   # or ios
```

## Testing

Unit tests cover the shuffle algorithm and timer logic:

```bash
cd frontend && npm test
```

## Documentation

The complete product specification lives in [`docs/project-spec.md`](docs/project-spec.md).
AI-assistant instructions for working on this codebase are in [`CLAUDE.md`](CLAUDE.md).

## License

TBD
