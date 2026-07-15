import { create } from 'zustand';
import type { GameSession, GameSessionResult, GameStatus } from '@/domain/gameSession';
import type { TeamInput } from '@/domain/team';
import type { Difficulty, Word } from '@/domain/word';
import { feedback } from '@/application/feedbackService';
import { getServices } from '@/application/services';
import { TimerService } from '@/application/timerService';
import { skipPenaltyMs } from '@/lib/time';

const timer = new TimerService();

let skipSequence = 0;

/** The most recent skip penalty, for the "−Ns" fly-off animation. */
export interface SkipEvent {
  id: number;
  penaltySeconds: number;
}

interface GameState {
  session: GameSession | null;
  status: GameStatus;
  currentIndex: number;
  correct: number;
  skipped: number;
  elapsedMs: number;
  lastResult: GameSessionResult | null;
  lastSkip: SkipEvent | null;

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
    if (elapsedMs >= session.durationMs) feedback.timerEnd();
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

  /** Removes a shown card from future decks (no-repeat pool). */
  function markAppeared(wordId: number | undefined): void {
    if (wordId === undefined) return;
    void getServices().then(({ gameService }) => gameService.markCardAppeared(wordId));
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
      markAppeared(session.deck[currentIndex + 1]?.id);
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
    lastSkip: null,

    start: async (difficulty, durationMs, teamInput) => {
      const { gameService, teamService } = await getServices();
      const team = teamService.getOrCreate(teamInput);
      const session = gameService.createSession(difficulty, durationMs, team);
      // The first card is on screen as soon as the game starts.
      const first = session.deck[0];
      if (first) gameService.markCardAppeared(first.id);
      feedback.init();
      timer.start();
      set({
        session,
        status: 'playing',
        currentIndex: 0,
        correct: 0,
        skipped: 0,
        elapsedMs: 0,
        lastResult: null,
        lastSkip: null,
      });
    },

    markCorrect: () => {
      if (get().status !== 'playing') return;
      feedback.correct();
      advance('correct');
    },

    /**
     * Skipping costs time, not points: 10% of the round length burns off the
     * clock. If less time than the cost remains, the skip cannot be paid —
     * the round simply ends.
     */
    skip: () => {
      const { session, status, skipped } = get();
      if (!session || status !== 'playing') return;
      const penaltyMs = skipPenaltyMs(session.durationMs);
      const remaining = session.durationMs - timer.elapsedMs();
      feedback.skip();
      if (remaining <= penaltyMs) {
        timer.addPenalty(Math.max(0, remaining));
        set({ skipped: skipped + 1 });
        finish();
        return;
      }
      timer.addPenalty(penaltyMs);
      set({
        elapsedMs: timer.elapsedMs(),
        lastSkip: { id: ++skipSequence, penaltySeconds: Math.round(penaltyMs / 1000) },
      });
      advance('skipped');
    },

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
        lastSkip: null,
      });
    },
  };
});
