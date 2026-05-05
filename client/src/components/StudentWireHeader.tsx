import { Link, NavLink } from 'react-router-dom';
import { shortenAddress } from '../lib/format';
import { useWeb3 } from '../context/Web3Context';
import { WalletButton } from './WalletButton';

export function StudentWireHeader() {
  const { account, status } = useWeb3();

  const linkCls = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? 'border-b-2 border-slate-900 font-bold dark:border-white'
      : 'text-slate-600 hover:underline dark:text-slate-400';

  return (
    <header className="border-b-2 border-dashed border-slate-400 bg-white font-mono dark:border-slate-600 dark:bg-slate-900">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3">
        <Link
          to="/"
          className="rounded border border-dashed border-slate-400 px-2 py-1 text-xs font-bold uppercase tracking-wide dark:border-slate-500"
        >
          Logo EMSI
        </Link>
        <nav className="flex flex-wrap items-center gap-6 text-sm">
          <NavLink to="/student" className={linkCls}>
            Mes Diplômes
          </NavLink>
          <NavLink to="/verify" className={linkCls}>
            Vérifier
          </NavLink>
          <Link to="/guide" className="text-slate-600 hover:underline dark:text-slate-400">
            Aide
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          {status === 'connected' && account ? (
            <span className="rounded border border-dashed border-slate-400 px-2 py-1 text-xs dark:border-slate-500">
              {shortenAddress(account, 6, 4)}
            </span>
          ) : null}
          <WalletButton />
        </div>
      </div>
    </header>
  );
}
