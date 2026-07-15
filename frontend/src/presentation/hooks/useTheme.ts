import { useEffect } from 'react';
import { useSettingsStore } from '@/store/settingsStore';

/**
 * Applies the persisted theme (light / dark / system) and the
 * "Reduce Animations" flag to the document root.
 */
export function useTheme(): void {
  const theme = useSettingsStore((state) => state.theme);
  const reduceAnimations = useSettingsStore((state) => state.reduceAnimations);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const dark = theme === 'dark' || (theme === 'system' && media.matches);
      document.documentElement.classList.toggle('dark', dark);
    };
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [theme]);

  useEffect(() => {
    document.documentElement.classList.toggle('reduce-motion', reduceAnimations);
  }, [reduceAnimations]);
}
