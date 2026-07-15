import { create } from 'zustand';
import { DEFAULT_SETTINGS, type Theme } from '@/domain/settings';
import { getServices } from '@/application/services';

interface SettingsState {
  theme: Theme;
  reduceAnimations: boolean;
  gameDurationSec: number;
  tickSound: boolean;
  soundEffects: boolean;
  vibration: boolean;
  endAlert: boolean;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setTheme: (theme: Theme) => Promise<void>;
  setReduceAnimations: (reduce: boolean) => Promise<void>;
  setGameDurationSec: (seconds: number) => Promise<void>;
  setTickSound: (enabled: boolean) => Promise<void>;
  setSoundEffects: (enabled: boolean) => Promise<void>;
  setVibration: (enabled: boolean) => Promise<void>;
  setEndAlert: (enabled: boolean) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  ...DEFAULT_SETTINGS,
  hydrated: false,

  hydrate: async () => {
    const { settingsService } = await getServices();
    set({ ...settingsService.load(), hydrated: true });
  },

  setTheme: async (theme) => {
    set({ theme });
    const { settingsService } = await getServices();
    settingsService.setTheme(theme);
  },

  setReduceAnimations: async (reduceAnimations) => {
    set({ reduceAnimations });
    const { settingsService } = await getServices();
    settingsService.setReduceAnimations(reduceAnimations);
  },

  setGameDurationSec: async (gameDurationSec) => {
    set({ gameDurationSec });
    const { settingsService } = await getServices();
    settingsService.setGameDurationSec(gameDurationSec);
  },

  setTickSound: async (tickSound) => {
    set({ tickSound });
    const { settingsService } = await getServices();
    settingsService.setTickSound(tickSound);
  },

  setSoundEffects: async (soundEffects) => {
    set({ soundEffects });
    const { settingsService } = await getServices();
    settingsService.setSoundEffects(soundEffects);
  },

  setVibration: async (vibration) => {
    set({ vibration });
    const { settingsService } = await getServices();
    settingsService.setVibration(vibration);
  },

  setEndAlert: async (endAlert) => {
    set({ endAlert });
    const { settingsService } = await getServices();
    settingsService.setEndAlert(endAlert);
  },
}));
