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
}

export const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  reduceAnimations: false,
  gameDurationSec: 180,
};
