import { DEFAULT_SETTINGS, isTheme, type Settings, type Theme } from '@/domain/settings';
import type { SettingsRepository } from '@/infrastructure/repositories/settingsRepository';

const THEME_KEY = 'theme';
const REDUCE_ANIMATIONS_KEY = 'reduceAnimations';
const GAME_DURATION_KEY = 'gameDurationSec';

export class SettingsService {
  constructor(private readonly repository: SettingsRepository) {}

  load(): Settings {
    const theme = this.repository.get(THEME_KEY);
    const reduce = this.repository.get(REDUCE_ANIMATIONS_KEY);
    const duration = Number(this.repository.get(GAME_DURATION_KEY));
    return {
      theme: theme !== null && isTheme(theme) ? theme : DEFAULT_SETTINGS.theme,
      reduceAnimations:
        reduce !== null ? reduce === 'true' : DEFAULT_SETTINGS.reduceAnimations,
      gameDurationSec:
        Number.isInteger(duration) && duration > 0
          ? duration
          : DEFAULT_SETTINGS.gameDurationSec,
    };
  }

  setTheme(theme: Theme): void {
    this.repository.set(THEME_KEY, theme);
  }

  setReduceAnimations(reduce: boolean): void {
    this.repository.set(REDUCE_ANIMATIONS_KEY, String(reduce));
  }

  setGameDurationSec(seconds: number): void {
    this.repository.set(GAME_DURATION_KEY, String(seconds));
  }
}
