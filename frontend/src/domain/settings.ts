export const THEMES = ['light', 'dark', 'system'] as const;

export type Theme = (typeof THEMES)[number];

export function isTheme(value: string): value is Theme {
  return (THEMES as readonly string[]).includes(value);
}

/** Round lengths offered before starting a game, in seconds. */
export const GAME_DURATION_OPTIONS = [60, 120, 180, 300] as const;

export interface Settings {
  theme: Theme;
  reduceAnimations: boolean;
  /** Last chosen countdown length in seconds; preselected on the next game. */
  gameDurationSec: number;
  /** Clock tick sound every second while the countdown runs. */
  tickSound: boolean;
  /** Sound effects for correct answers and skips. */
  soundEffects: boolean;
  /** Haptic feedback (skip vibration, timer-end long vibration). */
  vibration: boolean;
  /** Sound + long vibration when the countdown reaches zero. */
  endAlert: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  reduceAnimations: false,
  gameDurationSec: 180,
  tickSound: true,
  soundEffects: true,
  vibration: true,
  endAlert: true,
};
