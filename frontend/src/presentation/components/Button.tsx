import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'success' | 'danger' | 'ghost';

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    'bg-primary text-white shadow-sm shadow-primary/20 hover:bg-blue-700 focus-visible:outline-primary',
  secondary:
    'bg-white text-slate-800 shadow-sm shadow-slate-900/5 ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700 dark:hover:bg-slate-700 focus-visible:outline-primary',
  success:
    'bg-easy text-white shadow-sm shadow-easy/20 hover:bg-green-600 focus-visible:outline-easy',
  danger:
    'bg-hard text-white shadow-sm shadow-hard/20 hover:bg-red-600 focus-visible:outline-hard',
  ghost:
    'bg-transparent text-slate-600 hover:bg-slate-900/5 dark:text-slate-300 dark:hover:bg-white/10 focus-visible:outline-primary',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children: ReactNode;
}

/**
 * Material-style pill button: compact type, 48px minimum touch target,
 * visible keyboard focus ring.
 */
export function Button({ variant = 'primary', className = '', children, ...rest }: ButtonProps) {
  return (
    <button
      {...rest}
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${VARIANT_CLASSES[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
