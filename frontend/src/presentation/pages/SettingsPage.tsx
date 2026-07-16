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

interface ToggleRowProps {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function ToggleRow({ title, description, checked, onChange }: ToggleRowProps) {
  return (
    <label className="flex min-h-12 cursor-pointer items-center justify-between gap-3">
      <span>
        <span className="block text-sm font-medium">{title}</span>
        <span className="block text-xs text-slate-500 dark:text-slate-400">{description}</span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="size-5 shrink-0 accent-primary"
      />
    </label>
  );
}

export function SettingsPage() {
  const navigate = useNavigate();
  const theme = useSettingsStore((state) => state.theme);
  const reduceAnimations = useSettingsStore((state) => state.reduceAnimations);
  const tickSound = useSettingsStore((state) => state.tickSound);
  const soundEffects = useSettingsStore((state) => state.soundEffects);
  const vibration = useSettingsStore((state) => state.vibration);
  const endAlert = useSettingsStore((state) => state.endAlert);
  const setTheme = useSettingsStore((state) => state.setTheme);
  const setReduceAnimations = useSettingsStore((state) => state.setReduceAnimations);
  const setTickSound = useSettingsStore((state) => state.setTickSound);
  const setSoundEffects = useSettingsStore((state) => state.setSoundEffects);
  const setVibration = useSettingsStore((state) => state.setVibration);
  const setEndAlert = useSettingsStore((state) => state.setEndAlert);
  const skipCostMode = useSettingsStore((state) => state.skipCostMode);
  const skipCostValue = useSettingsStore((state) => state.skipCostValue);
  const hintCostSec = useSettingsStore((state) => state.hintCostSec);
  const hintLanguage = useSettingsStore((state) => state.hintLanguage);
  const setSkipCostMode = useSettingsStore((state) => state.setSkipCostMode);
  const setSkipCostValue = useSettingsStore((state) => state.setSkipCostValue);
  const setHintCostSec = useSettingsStore((state) => state.setHintCostSec);
  const setHintLanguage = useSettingsStore((state) => state.setHintLanguage);

  const skipValueMax = skipCostMode === 'percent' ? 50 : 120;

  function clampInt(raw: string, max: number): number | null {
    const value = Number(raw);
    if (!Number.isInteger(value) || value < 1 || value > max) return null;
    return value;
  }

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
        aria-labelledby="rules-heading"
        className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/60 dark:bg-slate-800 dark:ring-slate-700/60"
      >
        <h2 id="rules-heading" className="mb-3 text-sm font-semibold">
          Game rules
        </h2>
        <div className="flex flex-col gap-4">
          <div>
            <p className="mb-1.5 text-sm font-medium">Skip cost</p>
            <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">
              Time a skip burns off the clock — a percentage of the round or fixed seconds.
            </p>
            <div className="flex items-center gap-2">
              <div
                role="radiogroup"
                aria-label="Skip cost mode"
                className="grid flex-1 grid-cols-2 gap-1 rounded-xl bg-slate-200/60 p-1 dark:bg-slate-700"
              >
                {(
                  [
                    ['percent', '% of round'],
                    ['seconds', 'Seconds'],
                  ] as const
                ).map(([mode, label]) => (
                  <button
                    key={mode}
                    type="button"
                    role="radio"
                    aria-checked={skipCostMode === mode}
                    onClick={() => void setSkipCostMode(mode)}
                    className={`min-h-10 rounded-lg text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                      skipCostMode === mode
                        ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-600 dark:text-slate-100'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <label className="flex items-center gap-1.5">
                <span className="sr-only">Skip cost value</span>
                <input
                  type="number"
                  min={1}
                  max={skipValueMax}
                  value={skipCostValue}
                  onChange={(event) => {
                    const value = clampInt(event.target.value, skipValueMax);
                    if (value !== null) void setSkipCostValue(value);
                  }}
                  className="min-h-11 w-20 rounded-xl border border-slate-200 bg-white px-3 text-center text-sm font-semibold tabular-nums focus-visible:outline-2 focus-visible:outline-primary dark:border-slate-600 dark:bg-slate-700"
                />
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {skipCostMode === 'percent' ? '%' : 's'}
                </span>
              </label>
            </div>
          </div>

          <div>
            <p className="mb-1.5 text-sm font-medium">Hint cost</p>
            <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">
              Seconds the describer pays for tapping the hint.
            </p>
            <label className="flex items-center gap-1.5">
              <span className="sr-only">Hint cost in seconds</span>
              <input
                type="number"
                min={1}
                max={60}
                value={hintCostSec}
                onChange={(event) => {
                  const value = clampInt(event.target.value, 60);
                  if (value !== null) void setHintCostSec(value);
                }}
                className="min-h-11 w-20 rounded-xl border border-slate-200 bg-white px-3 text-center text-sm font-semibold tabular-nums focus-visible:outline-2 focus-visible:outline-primary dark:border-slate-600 dark:bg-slate-700"
              />
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">s</span>
            </label>
          </div>

          <div>
            <p className="mb-1.5 text-sm font-medium">Hint language</p>
            <div
              role="radiogroup"
              aria-label="Hint language"
              className="grid grid-cols-2 gap-1 rounded-xl bg-slate-200/60 p-1 dark:bg-slate-700"
            >
              {(
                [
                  ['ar', 'العربية'],
                  ['en', 'English'],
                ] as const
              ).map(([language, label]) => (
                <button
                  key={language}
                  type="button"
                  role="radio"
                  aria-checked={hintLanguage === language}
                  onClick={() => void setHintLanguage(language)}
                  className={`min-h-10 rounded-lg text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                    hintLanguage === language
                      ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-600 dark:text-slate-100'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="sound-heading"
        className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/60 dark:bg-slate-800 dark:ring-slate-700/60"
      >
        <h2 id="sound-heading" className="mb-1 text-sm font-semibold">
          Sound & haptics
        </h2>
        <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-700/60">
          <ToggleRow
            title="Clock tick"
            description="Tick sound every second while the timer runs"
            checked={tickSound}
            onChange={(checked) => void setTickSound(checked)}
          />
          <ToggleRow
            title="Sound effects"
            description="Chime on correct answers, buzz on skips"
            checked={soundEffects}
            onChange={(checked) => void setSoundEffects(checked)}
          />
          <ToggleRow
            title="Vibration"
            description="Vibrate on skips and when time runs out"
            checked={vibration}
            onChange={(checked) => void setVibration(checked)}
          />
          <ToggleRow
            title="Timer end alert"
            description="Alarm sound and long vibration when time is up"
            checked={endAlert}
            onChange={(checked) => void setEndAlert(checked)}
          />
        </div>
      </section>

      <section
        aria-labelledby="a11y-heading"
        className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/60 dark:bg-slate-800 dark:ring-slate-700/60"
      >
        <h2 id="a11y-heading" className="mb-3 text-sm font-semibold">
          Accessibility
        </h2>
        <ToggleRow
          title="Reduce animations"
          description="Minimize motion throughout the app"
          checked={reduceAnimations}
          onChange={(checked) => void setReduceAnimations(checked)}
        />
      </section>
    </main>
  );
}
