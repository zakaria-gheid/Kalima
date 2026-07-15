import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'outlined' | 'danger';

const VARIANT_CLASSES: Record<Variant, string> = {
  outlined:
    'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700 dark:hover:bg-slate-700 focus-visible:outline-primary',
  danger:
    'bg-white text-hard ring-1 ring-slate-200 hover:bg-hard/10 dark:bg-slate-800 dark:text-red-400 dark:ring-slate-700 dark:hover:bg-hard/20 focus-visible:outline-hard',
};

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  /** Required — icon-only buttons must always be labelled for screen readers. */
  'aria-label': string;
  children: ReactNode;
}

/** Material icon button: 48px circular outlined target with a 24px icon. */
export function IconButton({
  variant = 'outlined',
  className = '',
  children,
  ...rest
}: IconButtonProps) {
  return (
    <button
      type="button"
      {...rest}
      className={`inline-flex size-12 shrink-0 items-center justify-center rounded-full shadow-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${VARIANT_CLASSES[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
