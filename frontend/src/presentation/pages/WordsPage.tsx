import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeftIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { DIFFICULTIES, isDifficulty, type WordFilter } from '@/domain/word';
import {
  useCategories,
  useSetWordEnabled,
  useWords,
} from '@/presentation/hooks/useWords';
import { IconButton } from '@/presentation/components/IconButton';
import { DifficultyBadge } from '@/presentation/components/DifficultyBadge';

interface FilterForm {
  search: string;
  difficulty: string;
  category: string;
}

export function WordsPage() {
  const navigate = useNavigate();
  const { register, watch } = useForm<FilterForm>({
    defaultValues: { search: '', difficulty: '', category: '' },
  });
  const values = watch();

  const filter: WordFilter = {
    ...(values.search.trim() ? { search: values.search.trim() } : {}),
    ...(isDifficulty(values.difficulty) ? { difficulty: values.difficulty } : {}),
    ...(values.category ? { category: values.category } : {}),
  };

  const { data: words, isLoading } = useWords(filter);
  const { data: categories } = useCategories();
  const setEnabled = useSetWordEnabled();

  const selectClasses =
    'min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm focus-visible:outline-2 focus-visible:outline-primary dark:border-slate-700 dark:bg-slate-800';

  return (
    <main className="flex flex-1 flex-col gap-4 py-2">
      <header className="flex items-center gap-3">
        <IconButton aria-label="Back to home" onClick={() => navigate('/')}>
          <ArrowLeftIcon aria-hidden="true" className="size-6" />
        </IconButton>
        <h1 className="text-xl font-bold">Word List</h1>
      </header>

      <form className="flex flex-col gap-2" role="search" onSubmit={(e) => e.preventDefault()}>
        <label className="relative block">
          <span className="sr-only">Search words</span>
          <MagnifyingGlassIcon
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400"
          />
          <input
            type="search"
            placeholder="Search English or Arabic…"
            {...register('search')}
            className="min-h-12 w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-[15px] shadow-sm focus-visible:outline-2 focus-visible:outline-primary dark:border-slate-700 dark:bg-slate-800"
          />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="flex flex-col gap-1">
            <span className="sr-only">Difficulty</span>
            <select {...register('difficulty')} className={selectClasses}>
              <option value="">All difficulties</option>
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d}>
                  {d[0]?.toUpperCase() + d.slice(1)}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="sr-only">Category</span>
            <select {...register('category')} className={selectClasses}>
              <option value="">All categories</option>
              {(categories ?? []).map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
        </div>
      </form>

      <p aria-live="polite" className="text-xs font-medium text-slate-500 dark:text-slate-400">
        {isLoading ? 'Loading…' : `${words?.length ?? 0} words`}
      </p>

      <ul className="flex flex-col gap-1.5">
        {(words ?? []).map((word) => (
          <li
            key={word.id}
            className={`flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2 shadow-sm ring-1 ring-slate-200/60 dark:bg-slate-800 dark:ring-slate-700/60 ${
              word.enabled ? '' : 'opacity-50'
            }`}
          >
            <div className="flex min-w-0 flex-col gap-0.5">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span dir="ltr" lang="en" className="text-[15px] font-semibold">
                  {word.english}
                </span>
                <span dir="rtl" lang="ar" className="text-[15px] font-medium text-slate-600 dark:text-slate-300">
                  {word.arabic}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <DifficultyBadge difficulty={word.difficulty} />
                <span className="text-[11px] font-medium text-slate-400">{word.category}</span>
              </div>
            </div>
            <label className="inline-flex min-h-12 min-w-12 cursor-pointer items-center justify-center">
              <span className="sr-only">
                {word.enabled ? `Disable ${word.english}` : `Enable ${word.english}`}
              </span>
              <input
                type="checkbox"
                checked={word.enabled}
                onChange={(event) =>
                  setEnabled.mutate({ id: word.id, enabled: event.target.checked })
                }
                className="size-5 accent-primary"
              />
            </label>
          </li>
        ))}
      </ul>
    </main>
  );
}
