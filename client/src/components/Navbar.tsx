import { NavLink } from 'react-router-dom';
import { WalletButton } from './WalletButton';
import { IconBook, IconCap, IconHome, IconSearch, IconShield } from './Icon';

const linkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
    isActive
      ? 'bg-violet-100 text-violet-900 dark:bg-violet-900/40 dark:text-violet-100'
      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800',
  ].join(' ');

export function Navbar() {
  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xl font-semibold tracking-tight text-violet-700 dark:text-violet-400">
              EMSI
            </span>
            <span className="hidden text-slate-500 sm:inline dark:text-slate-400">·</span>
            <span className="hidden text-sm font-medium text-slate-800 sm:inline dark:text-slate-200">
              Blockchain Diploma Verifier
            </span>
          </div>
          <nav className="flex flex-wrap gap-1">
            <NavLink to="/" end className={linkClass}>
              <IconHome className="text-base" />
              Accueil
            </NavLink>
            <NavLink to="/admin" className={linkClass}>
              <IconShield className="text-base" />
              Administration
            </NavLink>
            <NavLink to="/student" className={linkClass}>
              <IconCap className="text-base" />
              Espace étudiant
            </NavLink>
            <NavLink to="/verify" className={linkClass}>
              <IconSearch className="text-base" />
              Vérification
            </NavLink>
            <NavLink to="/guide" className={linkClass}>
              <IconBook className="text-base" />
              Guide
            </NavLink>
          </nav>
        </div>
        <WalletButton />
      </div>
    </header>
  );
}
