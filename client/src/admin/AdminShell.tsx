import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { WalletButton } from '../components/WalletButton';
import { shortenAddress } from '../lib/format';
import { useWeb3 } from '../context/Web3Context';

function EmsiLogo() {
  return (
    <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight text-slate-900 dark:text-white">
      <span className="rounded border border-dashed border-slate-400 px-2 py-0.5 text-xs uppercase text-slate-600 dark:border-slate-500 dark:text-slate-300">
        Logo EMSI
      </span>
      <span className="hidden sm:inline">Blockchain Verify</span>
    </Link>
  );
}

export function AdminShell() {
  const { pathname } = useLocation();
  const { account, status } = useWeb3();
  const isDashboard = pathname !== '/admin';
  const connected = status === 'connected' && !!account;
  const loginScreen = pathname === '/admin' && !connected;

  return (
    <div className="flex min-h-screen flex-col bg-[#f4f6f8] font-mono text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="border-b-2 border-dashed border-slate-400 bg-white/90 dark:border-slate-600 dark:bg-slate-900/95">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-3">
          <EmsiLogo />
          {isDashboard && connected ? (
            <nav className="flex flex-wrap items-center gap-2 text-sm">
              <NavLink
                to="/admin/emit"
                className={({ isActive }) =>
                  [
                    'rounded border px-3 py-1.5',
                    isActive
                      ? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900'
                      : 'border-dashed border-slate-400 hover:bg-slate-100 dark:border-slate-500 dark:hover:bg-slate-800',
                  ].join(' ')
                }
              >
                + Émettre Nouveau
              </NavLink>
              <NavLink
                to="/admin/gestion"
                className={({ isActive }) =>
                  [
                    'rounded border px-3 py-1.5',
                    isActive
                      ? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900'
                      : 'border-dashed border-slate-400 hover:bg-slate-100 dark:border-slate-500 dark:hover:bg-slate-800',
                  ].join(' ')
                }
              >
                Gestion
              </NavLink>
            </nav>
          ) : (
            <span className="text-sm text-slate-500 dark:text-slate-400">Administration</span>
          )}
          <div className="flex items-center gap-2">
            {!loginScreen ? (
              <>
                {connected ? (
                  <span className="rounded border border-dashed border-slate-400 px-2 py-1 text-xs dark:border-slate-500">
                    {shortenAddress(account!)}
                  </span>
                ) : null}
                <WalletButton />
              </>
            ) : null}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <div key={pathname} className="animate-page-transition">
          <Outlet />
        </div>
      </main>

      <footer className="border-t-2 border-dashed border-slate-400 bg-white py-6 text-center text-sm dark:border-slate-600 dark:bg-slate-900">
        <p className="text-slate-600 dark:text-slate-400">Besoin d’aide ?</p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
          <Link to="/guide" className="border border-dashed border-slate-400 px-2 py-1 hover:bg-slate-100 dark:border-slate-500 dark:hover:bg-slate-800">
            Guide
          </Link>
          <span className="text-slate-400">|</span>
          <Link
            to="/verify"
            className="border border-dashed border-slate-400 px-2 py-1 hover:bg-slate-100 dark:border-slate-500 dark:hover:bg-slate-800"
          >
            Vérification Publique
          </Link>
        </div>
      </footer>
    </div>
  );
}
