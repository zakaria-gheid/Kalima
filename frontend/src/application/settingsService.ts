import { DEFAULT_SETTINGS, isTheme, type Settings, type Theme } from '@/domain/settings';
import type { SettingsRepository } from '@/infrastructure/repositories/settingsRepository';

const THEME_KEY = 'theme';
const REDUCE_ANIMATIONS_KEY = 'reduceAnimations';
const GAME_DURATION_KEY = 'gameDurationSec';
const TICK_SOUND_KEY = 'tickSound';
const SOUND_EFFECTS_KEY = 'soundEffects';
const VIBRATION_KEY = 'vibration';
const END_ALERT_KEY = 'endAlert';

export class SettingsService {
  constructor(private readonly repository: SettingsRepository) {}

  load(): Settings {
    const theme = this.repository.get(THEME_KEY);
    const duration = Number(this.repository.get(GAME_DURATION_KEY));
    return {
      theme: theme !== null && isTheme(theme) ? theme : DEFAULT_SETTINGS.theme,
      reduceAnimations: this.loadBool(REDUCE_ANIMATIONS_KEY, DEFAULT_SETTINGS.reduceAnimations),
      gameDurationSec:
        Number.isInteger(duration) && duration > 0
          ? duration
          : DEFAULT_SETTINGS.gameDurationSec,
      tickSound: this.loadBool(TICK_SOUND_KEY, DEFAULT_SETTINGS.tickSound),
      soundEffects: this.loadBool(SOUND_EFFECTS_KEY, DEFAULT_SETTINGS.soundEffects),
      vibration: this.loadBool(VIBRATION_KEY, DEFAULT_SETTINGS.vibration),
      endAlert: this.loadBool(END_ALERT_KEY, DEFAULT_SETTINGS.endAlert),
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

  setTickSound(enabled: boolean): void {
    this.repository.set(TICK_SOUND_KEY, String(enabled));
  }

  setSoundEffects(enabled: boolean): void {
    this.repository.set(SOUND_EFFECTS_KEY, String(enabled));
  }

  setVibration(enabled: boolean): void {
    this.repository.set(VIBRATION_KEY, String(enabled));
  }

  setEndAlert(enabled: boolean): void {
    this.repository.set(END_ALERT_KEY, String(enabled));
  }

  private loadBool(key: string, fallback: boolean): boolean {
    const value = this.repository.get(key);
    return value !== null ? value === 'true' : fallback;
  }
}
