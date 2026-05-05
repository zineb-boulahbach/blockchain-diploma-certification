import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import { getReadContractFlexible, parseOnChainDiploma } from '../lib/contract';
import { CONTRACT_ADDRESS, isConfigured, LOGS_FROM_BLOCK } from '../lib/config';
import { gatewayUrl } from '../lib/ipfs';
import { fmtDate, fmtDateFRDigits, shortenAddress, shortenHash } from '../lib/format';
import { contractExplorerUrl, txExplorerUrl } from '../lib/explorer';
import { INSTITUTION_LEGAL_NAME, chainDisplayName } from '../lib/brand';
import { useWeb3 } from '../context/Web3Context';

export function DiplomaDetailPage() {
  const { hash: hashParam } = useParams();
  const navigate = useNavigate();
  const { chainId, account, status } = useWeb3();
  const [txId, setTxId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const hash = useMemo(() => {
    if (!hashParam) return null;
    try {
      return decodeURIComponent(hashParam);
    } catch {
      return hashParam;
    }
  }, [hashParam]);

  const [dp, setDp] = useState<ReturnType<typeof parseOnChainDiploma> | null>(null);

  useEffect(() => {
    if (!hash || !isConfigured()) {
      setLoading(false);
      setNotFound(true);
      return;
    }
    (async () => {
      try {
        const c = await getReadContractFlexible();
        const exists = (await c.diplomaExists(hash)) as boolean;
        if (!exists) {
          setNotFound(true);
          setDp(null);
        } else {
          const raw = await c.getDiploma(hash);
          const parsed = parseOnChainDiploma(raw);
          setDp(parsed);
          setNotFound(false);
          const logs = await c.queryFilter(c.filters.DiplomaAdded(hash), LOGS_FROM_BLOCK, 'latest');
          const last =
            [...logs].pop() as undefined | {
              transactionHash?: string;
            };
          setTxId(last?.transactionHash ?? null);
        }
      } catch {
        setNotFound(true);
        setDp(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [hash]);

  const pdfCid = dp?.ipfsCID?.includes(':')
    ? (dp.ipfsCID.split(':').pop() ?? dp.ipfsCID)
    : (dp?.ipfsCID ?? '');

  const exportPdf = async () => {
    if (!dp) return;
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const line = (y: number, text: string) => doc.text(text, 40, y);
    let y = 48;
    doc.setFontSize(16);
    line(y, "Attestation d'authenticité — Diplôme blockchain");
    y += 32;
    doc.setFontSize(11);
    line(y, `Étudiant : ${dp.studentName}`);
    y += 20;
    line(y, `CNE / ID : ${dp.studentId}`);
    y += 20;
    line(y, `Filière : ${dp.filiere}`);
    y += 20;
    line(y, `Institution : ${INSTITUTION_LEGAL_NAME}`);
    y += 20;
    line(y, `Année : ${dp.yearObtained}`);
    y += 20;
    line(y, `Date d'émission (on-chain) : ${fmtDate(dp.issuanceDate)}`);
    y += 20;
    line(y, `Hash document : ${dp.diplomaHash}`);
    y += 20;
    line(y, `Contrat déployé : ${CONTRACT_ADDRESS}`);
    if (txId) {
      y += 20;
      line(y, `TX d'émission (si disponible) : ${txId}`);
    }
    y += 28;
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(
      "Ce fichier résume les preuves techniques. Comparez au hash SHA-256 du PDF fourni.",
      40,
      y,
      { maxWidth: 520 }
    );
    doc.save(`attestation-${dp.studentId || 'diploma'}.pdf`);
  };

  if (loading) {
    return <p className="animate-pulse text-center text-sm text-slate-500">Chargement du certificat…</p>;
  }

  if (notFound || !dp) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 dark:border-red-900 dark:bg-red-950/50">
        <p className="font-medium text-red-900 dark:text-red-100">Impossible de charger cette preuve.</p>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mt-4 text-sm text-red-700 underline dark:text-red-300"
        >
          Retour
        </button>
      </div>
    );
  }

  const revoked = dp.isRevoked;
  const networkLabel = chainDisplayName(chainId ?? 0n);

  return (
    <div className="animate-fade-in space-y-6 font-mono">
      <nav className="text-xs text-slate-600 dark:text-slate-400">
        <Link to="/" className="hover:underline">
          Accueil
        </Link>
        <span className="mx-1.5">›</span>
        <Link to="/student" className="hover:underline">
          Mes diplômes
        </Link>
        <span className="mx-1.5">›</span>
        <span className="font-semibold text-slate-900 dark:text-slate-100">Preuve</span>
      </nav>
      <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-dashed border-slate-300 pb-4 dark:border-slate-600">
        <button
          type="button"
          onClick={() => navigate('/student')}
          className="border-2 border-dashed border-slate-400 px-3 py-1 text-xs font-bold uppercase hover:bg-slate-100 dark:border-slate-500 dark:hover:bg-slate-800"
        >
          &lt; Retour à la liste
        </button>
        {status === 'connected' && account ? (
          <span className="rounded border border-dashed border-slate-400 px-2 py-1 text-xs dark:border-slate-500">
            {shortenAddress(account, 6, 4)}
          </span>
        ) : null}
      </div>

      <div
        className={`border-2 border-dashed px-4 py-3 text-center text-sm font-bold uppercase ${
          revoked
            ? 'border-amber-500 bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-100'
            : 'border-green-600 bg-green-50 text-green-900 dark:bg-green-950/40 dark:text-green-100'
        }`}
      >
        {revoked
          ? `Bannière : diplôme révoqué — émis le ${fmtDateFRDigits(dp.issuanceDate)}`
          : `Bannière : diplôme certifié avec succès — ${fmtDateFRDigits(dp.issuanceDate)}`}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="flex min-h-[220px] flex-col items-center justify-center border-2 border-dashed border-slate-400 bg-slate-50 p-6 text-center dark:border-slate-600 dark:bg-slate-950">
          {pdfCid && pdfCid !== 'local-demo' ? (
            <iframe
              title="pdf-preview"
              className="h-[280px] w-full border-2 border-dashed border-slate-300 dark:border-slate-600"
              src={`${gatewayUrl(pdfCid)}#toolbar=0`}
            />
          ) : (
            <>
              <p className="text-sm font-bold">Vignette du</p>
              <p className="text-sm font-bold">diplôme PDF</p>
              <p className="mt-2 text-xs text-slate-500">(Aperçu)</p>
              <p className="mt-4 text-xs text-slate-600 dark:text-slate-400">
                Configurez IPFS (Pinata) pour l’aperçu réel.
              </p>
            </>
          )}
        </div>
        <div className="border-2 border-dashed border-slate-400 p-6 dark:border-slate-600">
          <p className="text-lg font-bold uppercase leading-snug">{dp.filiere}</p>
          <p className="mt-4 text-sm">
            Délivré à : <strong>{dp.studentName}</strong>
          </p>
          <p className="mt-2 text-sm">
            Institution : <strong>{INSTITUTION_LEGAL_NAME}</strong>
          </p>
          <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
            Année d’obtention : {dp.yearObtained || '—'}
          </p>
        </div>
      </div>

      <section className="border-2 border-dashed border-slate-400 bg-white p-6 dark:border-slate-600 dark:bg-slate-900">
        <h2 className="border-b border-dashed border-slate-300 pb-2 text-sm font-bold uppercase dark:border-slate-600">
          Détails de la preuve cryptographique
        </h2>
        <div className="mt-4 space-y-3 text-sm">
          <p>
            Empreinte du fichier (Hash) :{' '}
            <span className="font-mono text-xs">
              {shortenHash(dp.diplomaHash)} (SHA-256)
            </span>
          </p>
          <p>
            ID de transaction (TxID) :{' '}
            {txId ? (
              <span className="font-mono text-xs">{shortenHash(txId, 12, 10)}</span>
            ) : (
              <span className="text-slate-500">—</span>
            )}
          </p>
          <p>Réseau : {networkLabel}</p>
          <p className="break-all text-xs text-slate-600 dark:text-slate-400">
            Contrat : {CONTRACT_ADDRESS}
          </p>
        </div>
        {txId ? (
          <a
            href={txExplorerUrl(chainId ?? 0n, txId)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-block border-2 border-dashed border-slate-900 bg-slate-900 px-4 py-2 text-xs font-bold uppercase text-white dark:border-white dark:bg-white dark:text-slate-900"
          >
            Voir sur l’explorateur (Etherscan)
          </a>
        ) : (
          <a
            href={contractExplorerUrl(chainId ?? 0n, CONTRACT_ADDRESS)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-block border-2 border-dashed border-slate-400 px-4 py-2 text-xs font-bold uppercase"
          >
            Voir le contrat sur l’explorateur
          </a>
        )}
      </section>

      <div className="flex flex-wrap gap-4">
        <a
          href={gatewayUrl(pdfCid)}
          className="border-2 border-dashed border-violet-700 bg-violet-700 px-6 py-3 text-xs font-bold uppercase text-white hover:opacity-90"
          target="_blank"
          rel="noopener noreferrer"
        >
          Télécharger le diplôme (PDF)
        </a>
        <button
          type="button"
          onClick={() => exportPdf()}
          className="border-2 border-dashed border-slate-400 px-6 py-3 text-xs font-bold uppercase hover:bg-slate-100 dark:border-slate-500 dark:hover:bg-slate-800"
        >
          Exporter l’attestation
        </button>
      </div>
    </div>
  );
}
