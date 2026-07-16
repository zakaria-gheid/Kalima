import { create } from 'zustand';
import {
  DEFAULT_SETTINGS,
  type HintLanguage,
  type SkipCostMode,
  type Theme,
} from '@/domain/settings';
import { getServices } from '@/application/services';

interface SettingsState {
  theme: Theme;
  reduceAnimations: boolean;
  gameDurationSec: number;
  tickSound: boolean;
  soundEffects: boolean;
  vibration: boolean;
  endAlert: boolean;
  skipCostMode: SkipCostMode;
  skipCostValue: number;
  hintCostSec: number;
  hintLanguage: HintLanguage;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setTheme: (theme: Theme) => Promise<void>;
  setReduceAnimations: (reduce: boolean) => Promise<void>;
  setGameDurationSec: (seconds: number) => Promise<void>;
  setTickSound: (enabled: boolean) => Promise<void>;
  setSoundEffects: (enabled: boolean) => Promise<void>;
  setVibration: (enabled: boolean) => Promise<void>;
  setEndAlert: (enabled: boolean) => Promise<void>;
  setSkipCostMode: (mode: SkipCostMode) => Promise<void>;
  setSkipCostValue: (value: number) => Promise<void>;
  setHintCostSec: (seconds: number) => Promise<void>;
  setHintLanguage: (language: HintLanguage) => Promise<void>;
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

  setSkipCostMode: async (skipCostMode) => {
    set({ skipCostMode });
    const { settingsService } = await getServices();
    settingsService.setSkipCostMode(skipCostMode);
  },

  setSkipCostValue: async (skipCostValue) => {
    set({ skipCostValue });
    const { settingsService } = await getServices();
    settingsService.setSkipCostValue(skipCostValue);
  },

  setHintCostSec: async (hintCostSec) => {
    set({ hintCostSec });
    const { settingsService } = await getServices();
    settingsService.setHintCostSec(hintCostSec);
  },

  setHintLanguage: async (hintLanguage) => {
    set({ hintLanguage });
    const { settingsService } = await getServices();
    settingsService.setHintLanguage(hintLanguage);
  },
}));
