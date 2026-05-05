import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { BrowserProvider } from 'ethers';
import {
  fetchAllDiplomasFromEvents,
  getReadContractFlexible,
  getSignerContract,
  type OnChainDiploma,
} from '../lib/contract';
import { CONTRACT_ADDRESS, isConfigured } from '../lib/config';
import { fmtDate, shortenHash } from '../lib/format';
import { txExplorerUrl } from '../lib/explorer';
import { useAdminAccess } from '../hooks/useAdminAccess';
import { useWeb3 } from '../context/Web3Context';
import { Modal } from '../components/Modal';

export function AdminGestionPage() {
  const { status, chainId } = useWeb3();
  const { isAdmin, loading } = useAdminAccess();
  const [searchParams, setSearchParams] = useSearchParams();
  const issued = searchParams.get('issued') === '1';
  const issueTx = searchParams.get('tx');
  const revokedFlash = searchParams.get('revoked') === '1';
  const [list, setList] = useState<OnChainDiploma[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [search, setSearch] = useState('');
  const [revokeTarget, setRevokeTarget] = useState<OnChainDiploma | null>(null);
  const [revokeBusy, setRevokeBusy] = useState(false);

  const load = useCallback(async () => {
    if (!isConfigured()) return;
    setLoadingList(true);
    try {
      const c = await getReadContractFlexible();
      setList(await fetchAllDiplomasFromEvents(c));
    } catch {
      setList([]);
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'connected' && isAdmin) void load();
  }, [status, isAdmin, load]);

  useEffect(() => {
    if (!issued && !revokedFlash) return;
    const t = window.setTimeout(() => {
      setSearchParams(
        (prev) => {
          const p = new URLSearchParams(prev);
          p.delete('issued');
          p.delete('tx');
          p.delete('revoked');
          return p;
        },
        { replace: true }
      );
    }, 12000);
    return () => window.clearTimeout(t);
  }, [issued, revokedFlash, setSearchParams]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (d) =>
        d.studentId.toLowerCase().includes(q) ||
        d.studentName.toLowerCase().includes(q) ||
        d.diplomaHash.toLowerCase().includes(q)
    );
  }, [list, search]);

  const doRevoke = async () => {
    if (!revokeTarget || !window.ethereum) return;
    setRevokeBusy(true);
    try {
      const signer = await new BrowserProvider(window.ethereum).getSigner();
      const c = getSignerContract(signer);
      const tx = await c.revokeDiploma(revokeTarget.diplomaHash);
      await tx.wait();
      setRevokeTarget(null);
      await load();
      setSearchParams(
        (prev) => {
          const p = new URLSearchParams(prev);
          p.set('revoked', '1');
          p.delete('issued');
          p.delete('tx');
          return p;
        },
        { replace: true }
      );
    } catch {
      alert('Révocation annulée ou échouée.');
    } finally {
      setRevokeBusy(false);
    }
  };

  if (!isConfigured()) return <p>Configuration manquante.</p>;
  if (status !== 'connected') return <Navigate to="/admin" replace />;
  if (loading) return <p className="animate-pulse text-sm">Chargement des droits…</p>;
  if (!isAdmin) return <p className="text-red-700">Accès refusé.</p>;

  return (
    <div className="animate-fade-in space-y-6">
      <nav className="text-xs text-slate-600 dark:text-slate-400">
        <Link to="/" className="hover:underline">
          Accueil
        </Link>
        <span className="mx-2">›</span>
        <span className="font-semibold text-slate-900 dark:text-slate-100">Admin</span>
        <span className="mx-2">›</span>
        <span>Gestion des diplômes</span>
      </nav>

      {issued ? (
        <div
          role="status"
          className="border-2 border-dashed border-green-600 bg-green-50 p-4 text-sm text-green-900 dark:bg-green-950/40 dark:text-green-100"
        >
          <p className="font-bold uppercase">Diplôme enregistré sur la blockchain</p>
          <p className="mt-1">La liste ci-dessous inclut le nouveau titre. Vous pouvez poursuivre avec une nouvelle émission.</p>
          {issueTx ? (
            <a
              href={txExplorerUrl(chainId ?? 0n, issueTx)}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-block border border-dashed border-green-700 px-3 py-1 text-xs font-bold uppercase hover:bg-green-100 dark:border-green-500 dark:hover:bg-green-900/30"
            >
              Voir la transaction sur l’explorateur
            </a>
          ) : null}
          <div className="mt-3">
            <Link
              to="/admin/emit"
              className="text-xs font-semibold text-green-800 underline dark:text-green-300"
            >
              → Émettre un autre diplôme
            </Link>
          </div>
        </div>
      ) : null}

      {revokedFlash ? (
        <div
          role="status"
          className="border-2 border-dashed border-amber-600 bg-amber-50 p-4 text-sm text-amber-950 dark:bg-amber-950/40 dark:text-amber-100"
        >
          <p className="font-bold uppercase">Révocation enregistrée</p>
          <p className="mt-1">
            Le badge du diplôme concerné passe à « Révoqué » pour toutes les vérifications publiques.
          </p>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-lg font-bold uppercase tracking-wide">Tableau de bord de gestion</h1>
        <Link
          to="/admin/emit"
          className="border-2 border-dashed border-slate-900 bg-slate-900 px-3 py-1.5 text-xs font-bold uppercase text-white dark:border-white dark:bg-white dark:text-slate-900"
        >
          + Émettre Nouveau
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-2 border-dashed border-slate-400 bg-white p-3 dark:border-slate-600 dark:bg-slate-900">
        <label className="flex flex-1 flex-wrap items-center gap-2 text-sm">
          <span className="sr-only">Recherche</span>
          <span className="text-slate-600 dark:text-slate-400">Rechercher un étudiant ou un ID…</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-w-[200px] flex-1 border-2 border-dashed border-slate-300 px-2 py-1 dark:border-slate-600 dark:bg-slate-950"
          />
        </label>
        <button
          type="button"
          className="border-2 border-dashed border-slate-400 px-3 py-1 font-bold dark:border-slate-500"
          aria-label="Rechercher"
        >
          Q
        </button>
        <button
          type="button"
          onClick={() => load()}
          className="text-xs underline"
        >
          {loadingList ? '…' : 'Rafraîchir'}
        </button>
      </div>

      <h2 className="text-sm font-bold uppercase text-slate-600 dark:text-slate-400">
        Liste des diplômes émis
      </h2>

      <div className="overflow-x-auto border-2 border-dashed border-slate-400 bg-white dark:border-slate-600 dark:bg-slate-900">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b-2 border-dashed border-slate-300 dark:border-slate-600">
              <th className="p-3 font-bold">ID</th>
              <th className="p-3 font-bold">Nom</th>
              <th className="p-3 font-bold">Date</th>
              <th className="p-3 font-bold">Hash</th>
              <th className="p-3 font-bold">Statut</th>
              <th className="p-3 font-bold">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((d) => (
              <tr key={d.diplomaHash} className="border-b border-dashed border-slate-200 dark:border-slate-700">
                <td className="p-3 font-mono text-xs">{d.studentId}</td>
                <td className="p-3">{d.studentName || '—'}</td>
                <td className="p-3">{fmtDate(d.issuanceDate)}</td>
                <td className="p-3 font-mono text-xs">{shortenHash(d.diplomaHash)}</td>
                <td className="p-3">
                  {d.isRevoked ? (
                    <span className="border border-dashed border-red-500 px-2 py-0.5 text-xs font-bold uppercase text-red-800 dark:text-red-300">
                      Révoqué
                    </span>
                  ) : (
                    <span className="border border-dashed border-green-600 px-2 py-0.5 text-xs font-bold uppercase text-green-800 dark:text-green-300">
                      Valide
                    </span>
                  )}
                </td>
                <td className="p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {d.issueTxHash ? (
                      <a
                        href={txExplorerUrl(chainId ?? 0n, d.issueTxHash)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-lg"
                        title="Transaction sur l’explorateur"
                      >
                        ↗
                      </a>
                    ) : (
                      <a
                        href={txExplorerUrl(chainId ?? 0n, CONTRACT_ADDRESS)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-lg opacity-50"
                        title="Contrat"
                      >
                        ↗
                      </a>
                    )}
                    {!d.isRevoked ? (
                      <button
                        type="button"
                        onClick={() => setRevokeTarget(d)}
                        className="border border-dashed border-red-500 px-2 py-0.5 text-xs font-bold uppercase text-red-800 dark:text-red-300"
                      >
                        Revoke
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filtered.length && !loadingList ? (
          <p className="p-8 text-center text-sm text-slate-500">Aucun diplôme.</p>
        ) : null}
      </div>

      <Modal
        open={!!revokeTarget}
        title="Confirmation de révocation"
        onClose={() => !revokeBusy && setRevokeTarget(null)}
        footer={
          <>
            <button
              type="button"
              disabled={revokeBusy}
              onClick={() => setRevokeTarget(null)}
              className="border-2 border-dashed border-slate-400 px-4 py-2 text-sm font-bold uppercase dark:border-slate-500"
            >
              Annuler
            </button>
            <button
              type="button"
              disabled={revokeBusy}
              onClick={() => void doRevoke()}
              className="border-2 border-dashed border-orange-600 bg-orange-600 px-4 py-2 text-sm font-bold uppercase text-white"
            >
              {revokeBusy ? '…' : 'Confirmer révocation'}
            </button>
          </>
        }
      >
        <p className="font-bold uppercase text-orange-800 dark:text-orange-200">
          Attention : cette action va invalider le diplôme sur la blockchain de façon permanente.
        </p>
        {revokeTarget ? (
          <p className="mt-3 font-mono text-xs">{shortenHash(revokeTarget.diplomaHash)}</p>
        ) : null}
      </Modal>
    </div>
  );
}
