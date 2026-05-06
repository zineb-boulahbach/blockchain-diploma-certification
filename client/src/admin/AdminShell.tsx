import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { WalletButton } from '../components/WalletButton';
import { IconBook, IconHome, IconPlus, IconSearch, IconShield, IconTable } from '../components/Icon';
import { shortenAddress } from '../lib/format';
import { useWeb3 } from '../context/Web3Context';

const topLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
    isActive
      ? 'bg-violet-100 text-violet-900 dark:bg-violet-900/40 dark:text-violet-100'
      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800',
  ].join(' ');

function EmsiLogo() {
  return (
    <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight text-slate-900 dark:text-white">
      <span className="text-xl font-semibold tracking-tight text-violet-700 dark:text-violet-400">EMSI</span>
      <span className="hidden text-slate-500 sm:inline dark:text-slate-400">·</span>
      <span className="hidden text-sm font-medium text-slate-800 sm:inline dark:text-slate-200">
        Administration
      </span>
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
    <div className="flex min-h-screen flex-col bg-slate-50 font-mono text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <EmsiLogo />
          {isDashboard && connected ? (
            <nav className="flex flex-wrap gap-1">
              <NavLink to="/" end className={topLinkClass}>
                <IconHome className="text-base" />
                Accueil
              </NavLink>
              <NavLink
                to="/admin/emit"
                className={topLinkClass}
              >
                <IconPlus className="text-base" />
                Émettre
              </NavLink>
              <NavLink
                to="/admin/gestion"
                className={topLinkClass}
              >
                <IconTable className="text-base" />
                Gestion
              </NavLink>
            </nav>
          ) : (
            <span className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <IconShield className="text-base" />
              Administration
            </span>
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

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <div key={pathname} className="animate-page-transition">
          <Outlet />
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white py-6 text-center text-sm dark:border-slate-800 dark:bg-slate-950/60">
        <p className="text-slate-600 dark:text-slate-400">Besoin d’aide ?</p>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          <Link
            to="/guide"
            className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-violet-300 hover:bg-violet-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-violet-700 dark:hover:bg-slate-900"
          >
            <IconBook className="text-base" />
            Guide
          </Link>
          <Link
            to="/verify"
            className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-violet-300 hover:bg-violet-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-violet-700 dark:hover:bg-slate-900"
          >
            <IconSearch className="text-base" />
            Vérification Publique
          </Link>
        </div>
      </footer>
    </div>
  );
}
