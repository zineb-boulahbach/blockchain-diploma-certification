import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  getReadContractFlexible,
  parseOnChainDiploma,
  type OnChainDiploma,
} from '../lib/contract';
import { isConfigured, LOGS_FROM_BLOCK } from '../lib/config';
import { computePdfSha256Hex, normalizeBytes32 } from '../lib/hash';
import { INSTITUTION_LEGAL_NAME, chainDisplayName } from '../lib/brand';
import { fmtDateFRDigits } from '../lib/format';
import { txExplorerUrl } from '../lib/explorer';
import { useWeb3 } from '../context/Web3Context';

type Phase = 'idle' | 'hashing' | 'query' | 'done';

export function VerifyPage() {
  const [searchParams] = useSearchParams();
  const { chainId } = useWeb3();
  const [manualQuery, setManualQuery] = useState('');
  const [progress, setProgress] = useState(0);
  const [liveHash, setLiveHash] = useState<string | null>(null);
  const [detectedName, setDetectedName] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [diploma, setDiploma] = useState<OnChainDiploma | null>(null);
  const [missing, setMissing] = useState(false);
  const [proofTx, setProofTx] = useState<string | null>(null);
  const [fromFile, setFromFile] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  const resetVerification = useCallback(() => {
    setManualQuery('');
    setProgress(0);
    setLiveHash(null);
    setDetectedName(null);
    setPhase('idle');
    setDiploma(null);
    setMissing(false);
    setProofTx(null);
    setFromFile(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const applyResult = useCallback(async (hexHash: string) => {
    if (!isConfigured()) return;
    try {
      setPhase('query');
      const c = await getReadContractFlexible();
      const exists = (await c.diplomaExists(hexHash)) as boolean;
      if (!exists) {
        setMissing(true);
        setDiploma(null);
        setProofTx(null);
      } else {
        const raw = await c.getDiploma(hexHash);
        const d = parseOnChainDiploma(raw);
        setDiploma(d);
        setMissing(false);
        let tx: string | null = null;
        try {
          const logs = await c.queryFilter(c.filters.DiplomaAdded(hexHash), LOGS_FROM_BLOCK, 'latest');
          const last = [...logs].pop() as { transactionHash?: string } | undefined;
          tx = last?.transactionHash ?? null;
        } catch {
          tx = null;
        }
        setProofTx(tx);
      }
    } catch {
      setMissing(true);
      setDiploma(null);
      setProofTx(null);
    } finally {
      setPhase('done');
      setProgress(100);
    }
  }, []);

  const runFileVerification = async (file: File) => {
    if (!file) return;
    setFromFile(true);
    setPhase('hashing');
    setProgress(10);
    setLiveHash(null);
    setDiploma(null);
    setMissing(false);
    setProofTx(null);
    setDetectedName(file.name);
    const interval = window.setInterval(() => {
      setProgress((p) => Math.min(95, p + 8));
    }, 120);
    try {
      const h = await computePdfSha256Hex(file);
      setLiveHash(h);
      setProgress(100);
      await applyResult(h);
    } finally {
      window.clearInterval(interval);
    }
  };

  const runManualVerify = async () => {
    const raw = manualQuery.trim();
    if (!raw || !isConfigured()) return;
    setFromFile(false);
    setDetectedName(null);
    const asHash = normalizeBytes32(raw);
    if (asHash) {
      setPhase('hashing');
      setProgress(40);
      setLiveHash(asHash);
      const interval = window.setInterval(() => setProgress((p) => Math.min(95, p + 15)), 80);
      await new Promise((r) => setTimeout(r, 400));
      window.clearInterval(interval);
      setProgress(100);
      await applyResult(asHash);
      return;
    }
    setPhase('query');
    setProgress(30);
    setLiveHash(null);
    setDiploma(null);
    setMissing(false);
    setProofTx(null);
    try {
      const c = await getReadContractFlexible();
      const hashes = (await c.getHashesByStudentId(raw)) as string[];
      if (!hashes?.length) {
        setMissing(true);
        setPhase('done');
        setProgress(100);
        return;
      }
      const hex = hashes[hashes.length - 1];
      setLiveHash(hex);
      await applyResult(hex);
    } catch {
      setMissing(true);
      setPhase('done');
      setProgress(100);
    }
  };

  useEffect(() => {
    const h = searchParams.get('h');
    if (!h || !isConfigured()) return;
    const n = normalizeBytes32(h);
    if (!n) return;
    void (async () => {
      setManualQuery(h);
      setFromFile(false);
      setLiveHash(n);
      setPhase('hashing');
      setProgress(100);
      await applyResult(n);
    })();
  }, [searchParams, applyResult]);

  const verdict = useMemo(() => {
    if (phase !== 'done') return null;
    if (missing || !diploma) return 'unknown' as const;
    if (diploma.isRevoked) return 'revoked' as const;
    return 'valid' as const;
  }, [phase, missing, diploma]);

  useEffect(() => {
    if (phase !== 'done' || verdict == null) return;
    requestAnimationFrame(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }, [phase, verdict]);

  const networkLabel = chainDisplayName(chainId ?? 0n);

  if (!isConfigured()) {
    return (
      <div className="p-6">
        <p className="rounded border-2 border-dashed border-amber-500 bg-amber-50 p-4 text-sm dark:bg-amber-950/40">
          Définissez <strong>VITE_CONTRACT_ADDRESS</strong> et de préférence <strong>VITE_RPC_URL</strong> pour la
          lecture sans portefeuille.
        </p>
      </div>
    );
  }

  const showAnalysis = phase === 'hashing' || phase === 'query';

  return (
    <div className="mx-auto min-h-screen max-w-3xl px-4 py-8">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b-2 border-dashed border-slate-400 pb-4 dark:border-slate-600">
        <Link
          to="/"
          className="rounded border border-dashed border-slate-500 px-2 py-1 text-xs font-bold uppercase dark:border-slate-400"
        >
          Logo EMSI
        </Link>
        <div className="flex flex-wrap justify-end gap-2 text-sm">
          <Link
            to="/"
            className="border border-dashed border-slate-400 px-2 py-1 hover:bg-white dark:border-slate-500 dark:hover:bg-slate-900"
          >
            Accueil
          </Link>
          <Link
            to="/student"
            className="border border-dashed border-slate-400 px-2 py-1 hover:bg-white dark:border-slate-500 dark:hover:bg-slate-900"
          >
            Espace étudiant
          </Link>
          <Link
            to="/admin"
            className="border border-dashed border-slate-400 px-2 py-1 hover:bg-white dark:border-slate-500 dark:hover:bg-slate-900"
          >
            Accès Admin
          </Link>
          <Link
            to="/guide"
            className="border border-dashed border-slate-400 px-2 py-1 hover:bg-white dark:border-slate-500 dark:hover:bg-slate-900"
          >
            Aide / FAQ
          </Link>
        </div>
      </header>

      <div className="text-center">
        <h1 className="text-xl font-bold uppercase tracking-tight sm:text-2xl">
          Vérificateur de diplômes blockchain
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Vérifiez l’authenticité d’un titre en quelques secondes
        </p>
      </div>

      <div className="mt-10 space-y-8 border-2 border-dashed border-slate-400 bg-white/80 p-6 dark:border-slate-600 dark:bg-slate-900/80">
        <div
          role="presentation"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files[0];
            if (f?.type === 'application/pdf') void runFileVerification(f);
          }}
          onClick={() => document.getElementById('v-pdf')?.click()}
          className="flex cursor-pointer flex-col items-center justify-center border-2 border-dashed border-slate-400 py-14 dark:border-slate-500"
        >
          <input
            id="v-pdf"
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void runFileVerification(f);
            }}
          />
          <span className="text-4xl" aria-hidden>
            🛡️
          </span>
          <p className="mt-4 text-center text-sm font-bold uppercase">Glissez le diplôme PDF ici</p>
          <p className="mt-2 text-center text-sm">
            ou{' '}
            <button type="button" className="font-semibold underline">
              Sélectionner un fichier
            </button>
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold">OU recherchez par identifiant :</p>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <input
              value={manualQuery}
              onChange={(e) => setManualQuery(e.target.value)}
              placeholder="Entrez le Hash ou l’ID du diplôme…"
              className="min-w-0 flex-1 border-2 border-dashed border-slate-400 px-3 py-2 text-sm dark:border-slate-500 dark:bg-slate-950"
            />
            <button
              type="button"
              onClick={() => void runManualVerify()}
              className="border-2 border-dashed border-slate-900 bg-slate-900 px-6 py-2 text-sm font-bold uppercase text-white dark:border-white dark:bg-white dark:text-slate-900"
            >
              Vérifier
            </button>
          </div>
        </div>
      </div>

      {showAnalysis ? (
        <section className="animate-fade-in mt-10 border-2 border-dashed border-slate-400 bg-white p-6 dark:border-slate-600 dark:bg-slate-900">
          <h2 className="text-center text-sm font-bold uppercase">Analyse d’authenticité en cours…</h2>
          <div className="mt-6 border-2 border-dashed border-slate-300 p-4 dark:border-slate-600">
            <p className="text-center text-3xl" aria-hidden>
              📄
            </p>
            {detectedName ? (
              <p className="mt-3 text-center text-sm">
                Fichier détecté : <strong>{detectedName}</strong>
              </p>
            ) : (
              <p className="mt-3 text-center text-sm text-slate-500">Recherche par identifiant ou hash…</p>
            )}
            <p className="mt-4 text-xs font-semibold uppercase text-slate-600 dark:text-slate-400">
              Génération de l’empreinte numérique (Hash) :
            </p>
            <div className="mt-2 h-3 w-full overflow-hidden border border-slate-400 dark:border-slate-500">
              <div className="h-full bg-slate-800 transition-all dark:bg-slate-200" style={{ width: `${progress}%` }} />
            </div>
            <p className="mt-1 text-right text-xs">{progress}%</p>
            {liveHash ? (
              <p className="mt-3 break-all font-mono text-xs">
                HASH SHA-256 : {liveHash.slice(0, 8)}…{liveHash.slice(-12)}
              </p>
            ) : null}
          </div>
          <ul className="mt-6 space-y-2 text-sm">
            <li>
              {fromFile || liveHash || phase === 'query' ? '✓' : '○'} Hachage local terminé (confidentialité garantie)
            </li>
            <li className={phase === 'query' ? 'animate-pulse font-semibold' : ''}>
              {phase === 'query' ? '✓' : '○'} Recherche de correspondance sur le réseau {networkLabel}…
            </li>
          </ul>
          <div className="mt-6 border-2 border-dashed border-slate-300 p-3 text-xs dark:border-slate-600">
            <p className="font-bold uppercase">Note technique :</p>
            <p className="mt-1">
              Le hachage est effectué dans votre navigateur. Le contenu de votre document ne quitte jamais votre
              ordinateur.
            </p>
          </div>
        </section>
      ) : null}

      <div ref={resultsRef} className="space-y-6">
      {verdict === 'valid' && diploma ? (
        <section className="animate-fade-in mt-10 border-2 border-dashed border-green-600 bg-green-50 p-6 text-green-900 dark:border-green-700 dark:bg-green-950/50 dark:text-green-100">
          <div className="flex gap-3">
            <span className="text-3xl" aria-hidden>
              ✓
            </span>
            <div>
              <h2 className="font-bold uppercase">Résultat : document authentique</h2>
              <p className="mt-3 text-sm">
                Le document correspond exactement à l’empreinte stockée sur la blockchain {networkLabel}.
              </p>
              <div className="mt-4 border-2 border-dashed border-green-700 p-4 dark:border-green-600">
                <p className="text-xs font-bold uppercase">Détails certifiés :</p>
                <p className="mt-2 text-sm">Étudiant : {diploma.studentName.toUpperCase()}</p>
                <p className="mt-1 text-sm">Émis par : {INSTITUTION_LEGAL_NAME}</p>
                <p className="mt-1 text-sm">Date de certification : {fmtDateFRDigits(diploma.issuanceDate)}</p>
              </div>
              {proofTx ? (
                <a
                  href={txExplorerUrl(chainId ?? 0n, proofTx)}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-block border-2 border-dashed border-green-800 px-4 py-2 text-xs font-bold uppercase hover:bg-green-100 dark:border-green-400 dark:hover:bg-green-900/40"
                >
                  Voir la preuve sur le réseau (explorateur)
                </a>
              ) : null}
              <p className="mt-4 text-xs text-green-800/80 dark:text-green-200/80">
                <Link to={`/diploma/${encodeURIComponent(diploma.diplomaHash)}`} className="font-semibold underline">
                  Page détail de la certification →
                </Link>
              </p>
            </div>
          </div>
        </section>
      ) : null}

      {verdict === 'revoked' && diploma ? (
        <section className="animate-fade-in mt-10 border-2 border-dashed border-orange-500 bg-orange-50 p-6 text-orange-950 dark:border-orange-600 dark:bg-orange-950/40 dark:text-orange-100">
          <div className="flex gap-3">
            <span className="text-3xl" aria-hidden>
              ⚠
            </span>
            <div>
              <h2 className="font-bold uppercase">Résultat : certificat révoqué</h2>
              <div className="mt-4 border-2 border-dashed border-orange-600 p-4 dark:border-orange-500">
                <p className="text-sm">Ce document est authentique mais n’est plus valide.</p>
                <p className="mt-2 text-sm">Il a été révoqué par l’institution émettrice.</p>
                <p className="mt-2 text-sm">Motif possible : erreur administrative ou annulation.</p>
                <p className="mt-2 text-sm">
                  Date de révocation : non stockée on-chain (consulter l’établissement).
                </p>
                <a
                  href="https://www.emsi.ma/"
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-block border-2 border-dashed border-orange-700 px-4 py-2 text-xs font-bold uppercase"
                >
                  Contacter l’établissement
                </a>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {verdict === 'unknown' ? (
        <section className="animate-fade-in mt-10 border-2 border-dashed border-red-600 bg-red-50 p-6 text-red-900 dark:border-red-700 dark:bg-red-950/40 dark:text-red-100">
          <div className="flex gap-3">
            <span className="text-3xl" aria-hidden>
              ✕
            </span>
            <div>
              <h2 className="font-bold uppercase">Résultat : échec de vérification</h2>
              <div className="mt-4 border-2 border-dashed border-red-700 p-4 dark:border-red-600">
                <p className="font-bold uppercase">Aucune correspondance trouvée sur la blockchain.</p>
                <p className="mt-3 text-sm font-semibold">Cela peut signifier :</p>
                <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">
                  <li>Le document a été altéré (même une seule lettre).</li>
                  <li>Le document n’a jamais été certifié par l’EMSI.</li>
                </ol>
                <p className="mt-4 text-sm font-bold uppercase">
                  Attention : ce document ne peut pas être considéré comme authentique.
                </p>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {verdict != null ? (
        <div className="flex justify-center pb-8">
          <button
            type="button"
            onClick={() => resetVerification()}
            className="border-2 border-dashed border-slate-900 bg-white px-6 py-2 text-sm font-bold uppercase hover:bg-slate-100 dark:border-slate-300 dark:bg-slate-900 dark:hover:bg-slate-800"
          >
            Nouvelle vérification
          </button>
        </div>
      ) : null}
      </div>
    </div>
  );
}
