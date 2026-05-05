import { Link, Navigate } from 'react-router-dom';
import { useAdminAccess } from '../hooks/useAdminAccess';
import { isConfigured } from '../lib/config';
import { useWeb3 } from '../context/Web3Context';
import { WalletButton, WalletErrorNotice } from '../components/WalletButton';

export function AdminIndexPage() {
  const { status, account } = useWeb3();
  const { isAdmin, loading } = useAdminAccess();

  if (!isConfigured()) {
    return (
      <p className="rounded border-2 border-dashed border-amber-500 bg-amber-50 p-4 text-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
        Définissez <strong>VITE_CONTRACT_ADDRESS</strong> dans <code>client/.env</code>.
      </p>
    );
  }

  if (loading && status === 'connected') {
    return <p className="animate-pulse text-center text-sm">Vérification des droits…</p>;
  }

  if (status === 'connected' && isAdmin) {
    return <Navigate to="/admin/gestion" replace />;
  }

  if (status === 'connected' && !isAdmin && account) {
    return (
      <div className="mx-auto max-w-lg border-2 border-dashed border-red-400 bg-red-50 p-6 dark:bg-red-950/30">
        <p className="font-bold uppercase">Adresse non autorisée</p>
        <p className="mt-2 text-sm">
          Ce portefeuille n’est pas le <code>owner</code> du contrat. Connectez le compte déployeur.
        </p>
        <p className="mt-2 break-all font-mono text-xs opacity-80">{account}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg border-2 border-dashed border-slate-400 bg-white p-8 shadow-sm dark:border-slate-600 dark:bg-slate-900">
      <p className="mb-4 text-center text-xs">
        <Link to="/" className="font-semibold text-violet-700 underline hover:no-underline dark:text-violet-400">
          ← Retour accueil
        </Link>
      </p>
      <h1 className="text-center text-lg font-bold uppercase tracking-wide">Administration</h1>
      <div className="mx-auto mt-6 flex h-16 w-16 items-center justify-center rounded border-2 border-dashed border-slate-400 text-2xl dark:border-slate-500">
        ICO
      </div>
      <p className="mt-6 text-center text-sm leading-relaxed text-slate-700 dark:text-slate-300">
        Connectez votre portefeuille pour gérer les titres
      </p>
      <div className="mt-8 flex justify-center">
        <WalletButton />
      </div>
      <p className="mt-3 text-center text-xs text-slate-500">(MetaMask)</p>
      <p className="mt-4 text-center text-xs text-slate-500">
        Assurez-vous d’être sur le réseau attendu (Sepolia ou Ganache local).
      </p>
      <WalletErrorNotice />
    </div>
  );
}
