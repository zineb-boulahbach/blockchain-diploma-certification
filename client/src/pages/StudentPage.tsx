import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import {
  getReadContractFlexible,
  parseOnChainDiploma,
  type OnChainDiploma,
} from '../lib/contract';
import { isConfigured } from '../lib/config';
import { gatewayUrl } from '../lib/ipfs';
import { fmtDateFRDigits, formatRelativeFr } from '../lib/format';
import { useWeb3 } from '../context/Web3Context';
import { WalletButton, WalletErrorNotice } from '../components/WalletButton';
import { IconCap, IconDownload, IconShare } from '../components/Icon';

export function StudentPage() {
  const { account, status } = useWeb3();
  const [rows, setRows] = useState<OnChainDiploma[]>([]);
  const [loading, setLoading] = useState(false);
  const [share, setShare] = useState<OnChainDiploma | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  const load = useCallback(async () => {
    if (!account || !isConfigured()) return;
    setLoading(true);
    try {
      const c = await getReadContractFlexible();
      const hashes = (await c.getStudentDiplomas(account)) as string[];
      const list: OnChainDiploma[] = [];
      for (const h of hashes) {
        const raw = await c.getDiploma(h);
        list.push(parseOnChainDiploma(raw));
      }
      setRows(list);
      setLastSync(new Date());
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [account]);

  useEffect(() => {
    if (status === 'connected' && account) void load();
  }, [status, account, load]);

  const verifiedCount = useMemo(() => rows.filter((r) => !r.isRevoked).length, [rows]);
  const base = typeof window !== 'undefined' ? window.location.origin : '';

  const shareUrl = share ? `${base}/diploma/${encodeURIComponent(share.diplomaHash)}` : '';

  const copyLink = () => {
    if (!shareUrl) return;
    void navigator.clipboard.writeText(shareUrl);
  };

  const openLinkedIn = () => {
    if (!shareUrl) return;
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  if (!isConfigured()) {
    return (
      <p className="rounded border-2 border-dashed border-amber-500 bg-amber-50 p-4 text-sm dark:bg-amber-950/40">
        Configurez <strong>VITE_CONTRACT_ADDRESS</strong>.
      </p>
    );
  }

  if (status !== 'connected' || !account) {
    return (
      <div className="mx-auto max-w-lg space-y-6 border-2 border-dashed border-slate-400 bg-white p-8 text-center font-mono dark:border-slate-600 dark:bg-slate-900">
        <h1 className="text-lg font-bold uppercase">Mon portefeuille de certifications</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Connectez le wallet pour lequel l’école a émis vos titres.
        </p>
        <WalletButton />
        <WalletErrorNotice />
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-8 font-mono">
      <h1 className="text-center text-lg font-bold uppercase tracking-wide">
        Mon portefeuille de certifications
      </h1>

      <div className="flex flex-wrap items-center justify-center gap-6 border-2 border-dashed border-slate-400 bg-white px-6 py-4 text-sm dark:border-slate-600 dark:bg-slate-900">
        <span>
          Total : <strong>{loading ? '…' : rows.length}</strong> Diplômes
        </span>
        <span className="text-slate-500">|</span>
        <span>
          Diplômes valides : <strong>{loading ? '…' : verifiedCount}</strong>
        </span>
        <span className="text-slate-500">|</span>
        <span>
          Dernière mise à jour :{' '}
          <strong title={lastSync ? lastSync.toLocaleString('fr-FR') : undefined}>
            {lastSync ? formatRelativeFr(lastSync) : '—'}
          </strong>
        </span>
      </div>

      <h2 className="text-sm font-bold uppercase text-slate-600 dark:text-slate-400">Mes titres</h2>

      <div className="grid gap-6 sm:grid-cols-2">
        {rows.map((d) => (
          <article
            key={d.diplomaHash}
            className="flex flex-col border-2 border-dashed border-slate-400 bg-white p-5 dark:border-slate-600 dark:bg-slate-900"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded border-2 border-dashed border-slate-300 text-slate-700 dark:border-slate-600 dark:text-slate-200">
                <IconCap className="text-2xl" title="Diplôme" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold uppercase text-slate-500">EMSI</p>
                <h3 className="font-bold leading-tight">{d.filiere || 'Diplôme certifié'}</h3>
                <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                  Émis le : {fmtDateFRDigits(d.issuanceDate)}
                </p>
                <p className="mt-1 text-xs">
                  Statut :{' '}
                  {d.isRevoked ? (
                    <span className="border border-dashed border-red-500 px-1 font-bold uppercase text-red-800 dark:text-red-300">
                      Révoqué
                    </span>
                  ) : (
                    <span className="border border-dashed border-green-600 px-1 font-bold uppercase text-green-800 dark:text-green-300">
                      Vérifié
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-2 border-t border-dashed border-slate-300 pt-4 dark:border-slate-600">
              <Link
                to={`/diploma/${encodeURIComponent(d.diplomaHash)}`}
                className="inline-flex items-center gap-2 border-2 border-dashed border-slate-400 px-3 py-1 text-xs font-bold uppercase hover:bg-slate-50 dark:border-slate-500 dark:hover:bg-slate-800"
              >
                Voir →
              </Link>
              <button
                type="button"
                onClick={() => setShare(d)}
                className="inline-flex items-center gap-2 border-2 border-dashed border-slate-400 px-3 py-1 text-xs font-bold uppercase hover:bg-slate-50 dark:border-slate-500 dark:hover:bg-slate-800"
              >
                <IconShare className="text-sm" />
                Partager
              </button>
              <a
                href={gatewayUrl(d.ipfsCID.split(':').pop() ?? d.ipfsCID)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 border-2 border-dashed border-slate-400 px-3 py-1 text-xs font-bold uppercase hover:bg-slate-50 dark:border-slate-500 dark:hover:bg-slate-800"
              >
                <IconDownload className="text-sm" />
                PDF
              </a>
            </div>
          </article>
        ))}
      </div>

      {!rows.length && !loading ? (
        <p className="text-center text-sm text-slate-500">Aucun diplôme lié à cette adresse.</p>
      ) : null}

      {share ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="max-w-lg border-2 border-dashed border-slate-300 bg-white p-6 font-mono dark:border-slate-600 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-4">
              <h3 className="text-sm font-bold uppercase">Partager ma certification</h3>
              <button type="button" className="text-xl leading-none" onClick={() => setShare(null)} aria-label="Fermer">
                ×
              </button>
            </div>
            <p className="mt-2 text-xs uppercase text-slate-500">Focus sur le partage</p>
            <div className="mt-4 grid gap-6 sm:grid-cols-2">
              <div className="flex flex-col items-center gap-2">
                <div className="rounded border-2 border-dashed border-slate-400 p-2 dark:border-slate-500">
                  <QRCodeSVG value={shareUrl} size={160} />
                </div>
                <span className="text-xs text-slate-500">QR Code</span>
                <div className="flex h-20 w-full items-center justify-center border-2 border-dashed border-slate-300 text-xs text-slate-500 dark:border-slate-600">
                  Image / aperçu
                </div>
              </div>
              <div>
                <p className="text-xs font-bold">Lien de vérification :</p>
                <p className="mt-2 break-all rounded border border-dashed border-slate-300 p-2 text-[11px] dark:border-slate-600">
                  {shareUrl}
                </p>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => copyLink()}
                className="border-2 border-dashed border-slate-900 bg-slate-900 px-4 py-2 text-xs font-bold uppercase text-white dark:border-white dark:bg-white dark:text-slate-900"
              >
                Copier le lien
              </button>
              <button
                type="button"
                onClick={() => openLinkedIn()}
                className="border-2 border-dashed border-sky-600 px-4 py-2 text-xs font-bold uppercase text-sky-800 hover:bg-sky-50 dark:text-sky-300 dark:hover:bg-sky-950/40"
              >
                Ajouter à LinkedIn
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
