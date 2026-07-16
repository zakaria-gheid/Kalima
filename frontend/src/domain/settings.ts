export const THEMES = ['light', 'dark', 'system'] as const;

export type Theme = (typeof THEMES)[number];

export function isTheme(value: string): value is Theme {
  return (THEMES as readonly string[]).includes(value);
}

/** Round lengths offered before starting a game, in seconds. */
export const GAME_DURATION_OPTIONS = [60, 120, 180, 300] as const;

/** How the skip cost is expressed: % of the round length, or fixed seconds. */
export const SKIP_COST_MODES = ['percent', 'seconds'] as const;
export type SkipCostMode = (typeof SKIP_COST_MODES)[number];

/** Language the describer's hint is shown in. */
export const HINT_LANGUAGES = ['ar', 'en'] as const;
export type HintLanguage = (typeof HINT_LANGUAGES)[number];

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
  /** How the skip cost is expressed. */
  skipCostMode: SkipCostMode;
  /** Skip cost value: percent (1–50) or seconds (1–120) depending on the mode. */
  skipCostValue: number;
  /** What a hint costs the describer, in seconds off the clock. */
  hintCostSec: number;
  /** Language the describer's hint is shown in. */
  hintLanguage: HintLanguage;
}

export const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  reduceAnimations: false,
  gameDurationSec: 180,
  tickSound: true,
  soundEffects: true,
  vibration: true,
  endAlert: true,
  skipCostMode: 'percent',
  skipCostValue: 10,
  hintCostSec: 5,
  hintLanguage: 'ar',
};
