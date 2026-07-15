import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { ComputerDesktopIcon, MoonIcon, SunIcon } from '@heroicons/react/24/solid';
import { THEMES, type Theme } from '@/domain/settings';
import { useSettingsStore } from '@/store/settingsStore';
import { IconButton } from '@/presentation/components/IconButton';

const THEME_META: Record<Theme, { label: string; icon: typeof SunIcon }> = {
  light: { label: 'Light', icon: SunIcon },
  dark: { label: 'Dark', icon: MoonIcon },
  system: { label: 'System', icon: ComputerDesktopIcon },
};

export function SettingsPage() {
  const navigate = useNavigate();
  const theme = useSettingsStore((state) => state.theme);
  const reduceAnimations = useSettingsStore((state) => state.reduceAnimations);
  const setTheme = useSettingsStore((state) => state.setTheme);
  const setReduceAnimations = useSettingsStore((state) => state.setReduceAnimations);

  return (
    <main className="flex flex-1 flex-col gap-4 py-2">
      <header className="flex items-center gap-3">
        <IconButton aria-label="Back to home" onClick={() => navigate('/')}>
          <ArrowLeftIcon aria-hidden="true" className="size-6" />
        </IconButton>
        <h1 className="text-xl font-bold">Settings</h1>
      </header>

      <section
        aria-labelledby="theme-heading"
        className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/60 dark:bg-slate-800 dark:ring-slate-700/60"
      >
        <h2 id="theme-heading" className="mb-3 text-sm font-semibold">
          Theme
        </h2>
        <div role="radiogroup" aria-labelledby="theme-heading" className="grid grid-cols-3 gap-2">
          {THEMES.map((value) => {
            const { label, icon: Icon } = THEME_META[value];
            const selected = theme === value;
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => void setTheme(value)}
                className={`flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl border p-2 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                  selected
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-slate-200 text-slate-500 hover:border-slate-300 dark:border-slate-700 dark:text-slate-400'
                }`}
              >
                <Icon aria-hidden="true" className="size-5" />
                {label}
              </button>
            );
          })}
        </div>
      </section>

      <section
        aria-labelledby="a11y-heading"
        className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/60 dark:bg-slate-800 dark:ring-slate-700/60"
      >
        <h2 id="a11y-heading" className="mb-3 text-sm font-semibold">
          Accessibility
        </h2>
        <label className="flex min-h-12 cursor-pointer items-center justify-between gap-3">
          <span>
            <span className="block text-sm font-medium">Reduce animations</span>
            <span className="block text-xs text-slate-500 dark:text-slate-400">
              Minimize motion throughout the app
            </span>
          </span>
          <input
            type="checkbox"
            checked={reduceAnimations}
            onChange={(event) => void setReduceAnimations(event.target.checked)}
            className="size-5 shrink-0 accent-primary"
          />
        </label>
      </section>
    </main>
  );
}
