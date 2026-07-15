import { create } from 'zustand';
import type { GameSession, GameSessionResult, GameStatus } from '@/domain/gameSession';
import type { TeamInput } from '@/domain/team';
import type { Difficulty, Word } from '@/domain/word';
import { getServices } from '@/application/services';
import { TimerService } from '@/application/timerService';

const timer = new TimerService();

interface GameState {
  session: GameSession | null;
  status: GameStatus;
  currentIndex: number;
  correct: number;
  skipped: number;
  elapsedMs: number;
  lastResult: GameSessionResult | null;

  start: (difficulty: Difficulty, durationMs: number, team: TeamInput) => Promise<void>;
  markCorrect: () => void;
  skip: () => void;
  pause: () => void;
  resume: () => void;
  endEarly: () => void;
  syncElapsed: () => void;
  reset: () => void;
}

export function currentCard(state: Pick<GameState, 'session' | 'currentIndex'>): Word | null {
  return state.session?.deck[state.currentIndex] ?? null;
}

export const useGameStore = create<GameState>((set, get) => {
  /**
   * Ends the game exactly once (deck exhausted, countdown reaching zero, or
   * ending early all funnel here). State flips synchronously so a racing
   * clock tick or double click cannot finish twice; persistence follows.
   */
  function finish(): void {
    const { session, status, correct, skipped } = get();
    if (!session || (status !== 'playing' && status !== 'paused')) return;
    timer.pause();
    const elapsedMs = Math.min(timer.elapsedMs(), session.durationMs);
    const result: GameSessionResult = {
      id: session.id,
      difficulty: session.difficulty,
      startedAt: session.startedAt,
      endedAt: Date.now(),
      durationMs: session.durationMs,
      elapsedMs,
      cardsCompleted: correct,
      cardsSkipped: skipped,
      cardsTotal: session.deck.length,
      team: session.team,
    };
    set({ status: 'finished', elapsedMs, lastResult: result });
    void getServices().then(({ gameService }) => gameService.recordResult(result));
  }

  function advance(kind: 'correct' | 'skipped'): void {
    const { session, status, currentIndex, correct, skipped } = get();
    if (!session || status !== 'playing') return;
    const counts =
      kind === 'correct' ? { correct: correct + 1, skipped } : { correct, skipped: skipped + 1 };
    if (currentIndex + 1 >= session.deck.length) {
      set(counts);
      finish();
    } else {
      set({ ...counts, currentIndex: currentIndex + 1 });
    }
  }

  return {
    session: null,
    status: 'idle',
    currentIndex: 0,
    correct: 0,
    skipped: 0,
    elapsedMs: 0,
    lastResult: null,

    start: async (difficulty, durationMs, teamInput) => {
      const { gameService, teamService } = await getServices();
      const team = teamService.getOrCreate(teamInput);
      const session = gameService.createSession(difficulty, durationMs, team);
      timer.start();
      set({
        session,
        status: 'playing',
        currentIndex: 0,
        correct: 0,
        skipped: 0,
        elapsedMs: 0,
        lastResult: null,
      });
    },

    markCorrect: () => advance('correct'),
    skip: () => advance('skipped'),

    pause: () => {
      if (get().status !== 'playing') return;
      timer.pause();
      set({ status: 'paused', elapsedMs: timer.elapsedMs() });
    },

    resume: () => {
      if (get().status !== 'paused') return;
      timer.resume();
      set({ status: 'playing' });
    },

    endEarly: () => finish(),

    syncElapsed: () => {
      const { session, status } = get();
      if (!session || status !== 'playing') return;
      const elapsedMs = timer.elapsedMs();
      if (elapsedMs >= session.durationMs) {
        finish();
      } else {
        set({ elapsedMs });
      }
    },

    reset: () => {
      timer.reset();
      set({
        session: null,
        status: 'idle',
        currentIndex: 0,
        correct: 0,
        skipped: 0,
        elapsedMs: 0,
        lastResult: null,
      });
    },
  };
});
