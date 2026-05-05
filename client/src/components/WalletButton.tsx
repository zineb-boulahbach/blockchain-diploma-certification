import { shortenAddress } from '../lib/format';
import { EXPECTED_CHAIN_ID } from '../lib/config';
import { useWeb3 } from '../context/Web3Context';

export function WalletButton() {
  const { account, chainId, status, connect, disconnect } = useWeb3();

  const wrongNet =
    EXPECTED_CHAIN_ID != null &&
    chainId != null &&
    Number(chainId) !== EXPECTED_CHAIN_ID;

  if (!account || status !== 'connected') {
    return (
      <button
        type="button"
        disabled={status === 'connecting'}
        onClick={() => connect()}
        className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white shadow hover:bg-orange-600 disabled:opacity-60"
      >
        <span aria-hidden>🦊</span>
        {status === 'connecting' ? 'Connexion…' : 'Connecter MetaMask'}
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {wrongNet ? (
        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs text-amber-900 dark:bg-amber-900/40 dark:text-amber-100">
          Réseau différent ({chainId?.toString() ?? '?'}) — vérifiez Sepolia/local
        </span>
      ) : null}
      <span className="rounded-full bg-slate-100 px-3 py-1 font-mono text-xs text-slate-800 dark:bg-slate-800 dark:text-slate-100">
        {shortenAddress(account)}
      </span>
      <button
        type="button"
        onClick={() => disconnect()}
        className="text-sm text-violet-600 hover:underline dark:text-violet-400"
      >
        Déconnexion
      </button>
    </div>
  );
}

/** Affiche erreur MetaMask hors du bouton. */
export function WalletErrorNotice() {
  const { error, account } = useWeb3();
  if (!error || account) return null;
  return (
    <p className="text-center text-sm text-red-700 dark:text-red-400">
      {error}{' '}
      <a
        href="https://metamask.io/download/"
        className="font-medium underline"
        target="_blank"
        rel="noopener noreferrer"
      >
        Installer MetaMask
      </a>
    </p>
  );
}
