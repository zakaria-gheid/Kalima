import { useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';

/** Keeps the displayed elapsed time in sync while a game is running. */
export function useGameClock(): number {
  const status = useGameStore((state) => state.status);
  const elapsedMs = useGameStore((state) => state.elapsedMs);
  const syncElapsed = useGameStore((state) => state.syncElapsed);

  useEffect(() => {
    if (status !== 'playing') return;
    syncElapsed();
    const interval = setInterval(syncElapsed, 250);
    return () => clearInterval(interval);
  }, [status, syncElapsed]);

  return elapsedMs;
}
