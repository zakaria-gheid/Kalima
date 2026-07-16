import { create } from 'zustand';
import type { GameSession, GameSessionResult, GameStatus } from '@/domain/gameSession';
import type { TeamInput } from '@/domain/team';
import type { Difficulty, Word } from '@/domain/word';
import { feedback } from '@/application/feedbackService';
import { getServices } from '@/application/services';
import { TimerService } from '@/application/timerService';
import { skipPenaltyMs } from '@/lib/time';
import { useSettingsStore } from '@/store/settingsStore';

const timer = new TimerService();

let penaltySequence = 0;

/** The most recent time penalty (skip or hint), for the "−Ns" fly-off animation. */
export interface PenaltyEvent {
  id: number;
  penaltySeconds: number;
  kind: 'skip' | 'hint';
}

interface GameState {
  session: GameSession | null;
  status: GameStatus;
  currentIndex: number;
  correct: number;
  skipped: number;
  elapsedMs: number;
  lastResult: GameSessionResult | null;
  lastPenalty: PenaltyEvent | null;
  /** Deck index the describer bought a hint for; the hint stays visible on that card. */
  hintCardIndex: number | null;

  start: (difficulty: Difficulty, durationMs: number, team: TeamInput) => Promise<void>;
  markCorrect: () => void;
  skip: () => void;
  useHint: () => void;
  pause: () => void;
  resume: () => void;
  endEarly: () => void;
  discardLastGame: () => Promise<void>;
  syncElapsed: () => void;
  reset: () => void;
}

export function currentCard(state: Pick<GameState, 'session' | 'currentIndex'>): Word | null {
  return state.session?.deck[state.currentIndex] ?? null;
}

/** The configured skip cost for a round, from Settings (percent or seconds). */
export function currentSkipPenaltyMs(durationMs: number): number {
  const { skipCostMode, skipCostValue } = useSettingsStore.getState();
  return skipPenaltyMs(durationMs, skipCostMode, skipCostValue);
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
      set({ ...counts, currentIndex: currentIndex + 1, hintCardIndex: null });
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
    lastPenalty: null,
    hintCardIndex: null,

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
        lastPenalty: null,
        hintCardIndex: null,
      });
    },

    markCorrect: () => {
      if (get().status !== 'playing') return;
      feedback.correct();
      advance('correct');
    },

    /**
     * Skipping costs time, not points — the configured cost (percent of the
     * round or fixed seconds) burns off the clock. If less time than the
     * cost remains, the skip cannot be paid and the round simply ends.
     */
    skip: () => {
      const { session, status, skipped } = get();
      if (!session || status !== 'playing') return;
      const penaltyMs = currentSkipPenaltyMs(session.durationMs);
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
        lastPenalty: {
          id: ++penaltySequence,
          penaltySeconds: Math.round(penaltyMs / 1000),
          kind: 'skip',
        },
      });
      advance('skipped');
    },

    /**
     * The describer buys a hint for the current card: the configured hint
     * cost burns off the clock and the hint stays visible until the next
     * card. Not payable when less time than the cost remains.
     */
    useHint: () => {
      const { session, status, currentIndex, hintCardIndex } = get();
      if (!session || status !== 'playing' || hintCardIndex === currentIndex) return;
      const costMs = useSettingsStore.getState().hintCostSec * 1000;
      const remaining = session.durationMs - timer.elapsedMs();
      if (remaining <= costMs) return;
      feedback.hint();
      timer.addPenalty(costMs);
      set({
        elapsedMs: timer.elapsedMs(),
        hintCardIndex: currentIndex,
        lastPenalty: {
          id: ++penaltySequence,
          penaltySeconds: Math.round(costMs / 1000),
          kind: 'hint',
        },
      });
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

    /** Removes the just-finished game from the records — it won't count anywhere. */
    discardLastGame: async () => {
      const result = get().lastResult;
      if (!result) return;
      const { gameService } = await getServices();
      gameService.discardResult(result.id);
      set({ lastResult: null });
    },

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
        lastPenalty: null,
        hintCardIndex: null,
      });
    },
  };
});
