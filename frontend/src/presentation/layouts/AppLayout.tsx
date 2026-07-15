import { Link, Outlet, useLocation } from 'react-router-dom';

export function AppLayout() {
  const { pathname } = useLocation();
  // The home page carries the full hero logo; every other page gets the
  // compact brand bar so the logo is always visible, especially on mobile.
  const showBrandBar = pathname !== '/';

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-xl flex-col px-4 pb-6 pt-[max(0.5rem,env(safe-area-inset-top))]">
      {showBrandBar && (
        <header className="mb-1 flex items-center">
          <Link
            to="/"
            aria-label="Kalima — back to home"
            className="inline-flex min-h-12 items-center gap-2 rounded-full px-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <img src="/favicon.svg" alt="" className="size-7" />
            <span className="bg-gradient-to-r from-primary to-violet-600 bg-clip-text text-lg font-extrabold tracking-tight text-transparent">
              Kalima
            </span>
          </Link>
        </header>
      )}
      <Outlet />
    </div>
  );
}
