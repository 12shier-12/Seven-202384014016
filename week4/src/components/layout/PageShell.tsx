import { Link, NavLink, Outlet } from 'react-router-dom';

function navClass({ isActive }: { isActive: boolean }): string {
  return [
    'rounded-lg px-3 py-1.5 text-sm font-medium transition',
    isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700',
  ].join(' ');
}

export default function PageShell() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-600 text-lg text-white">🧳</span>
            <span className="leading-tight">
              <span className="block text-base font-semibold tracking-tight">Triply</span>
              <span className="hidden text-[11px] text-slate-400 sm:block">行程 · 打包清单</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            <NavLink to="/" end className={navClass}>
              行程
            </NavLink>
            <NavLink to="/settings" className={navClass}>
              设置
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 pb-24 md:pb-10">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-md items-stretch justify-around">
          <NavLink to="/" end className={({ isActive }) => `flex flex-1 flex-col items-center gap-1 py-2 text-xs ${isActive ? 'text-indigo-600' : 'text-slate-400'}`}>
            <span className="text-lg">🗺️</span>
            行程
          </NavLink>
          <NavLink to="/settings" className={({ isActive }) => `flex flex-1 flex-col items-center gap-1 py-2 text-xs ${isActive ? 'text-indigo-600' : 'text-slate-400'}`}>
            <span className="text-lg">⚙️</span>
            设置
          </NavLink>
        </div>
      </nav>
    </div>
  );
}
