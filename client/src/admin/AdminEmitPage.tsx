import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { BrowserProvider, formatEther } from 'ethers';
import { getSignerContract } from '../lib/contract';
import { isConfigured } from '../lib/config';
import { computePdfSha256Hex } from '../lib/hash';
import { pinDiplomaPayload } from '../lib/ipfs';
import { FILIERES_OPTIONS } from '../lib/filieres';
import { chainDisplayName } from '../lib/brand';
import { shortenAddress } from '../lib/format';
import { useAdminAccess } from '../hooks/useAdminAccess';
import { useWeb3 } from '../context/Web3Context';
import { Modal } from '../components/Modal';

export function AdminEmitPage() {
  const navigate = useNavigate();
  const { status, chainId } = useWeb3();
  const { isAdmin, loading } = useAdminAccess();

  const [fullName, setFullName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [filiere, setFiliere] = useState<string>(FILIERES_OPTIONS[0]);
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [studentWallet, setStudentWallet] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fileHash, setFileHash] = useState<string | null>(null);
  const [gasText, setGasText] = useState<string | null>(null);
  const [txPhase, setTxPhase] = useState<'idle' | 'sign' | 'confirm' | 'done' | 'error'>('idle');
  const [err, setErr] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const onDrop = async (f: File | null) => {
    setFile(f);
    setFileHash(null);
    setErr(null);
    if (!f) return;
    try {
      setFileHash(await computePdfSha256Hex(f));
    } catch {
      setErr('Impossible de calculer le hash du fichier.');
    }
  };

  const estimateGas = useCallback(async () => {
    if (!window.ethereum || !fileHash || !studentId.trim() || !/^0x[a-fA-F0-9]{40}$/.test(studentWallet.trim())) {
      setGasText(null);
      return;
    }
    try {
      const signer = await new BrowserProvider(window.ethereum).getSigner();
      const c = getSignerContract(signer);
      const placeholderMeta = 'local-demo:local-demo';
      const gas = await c.addDiploma.estimateGas(
        fileHash,
        studentId.trim(),
        studentWallet.trim(),
        placeholderMeta,
        fullName.trim() || '—',
        filiere,
        year.trim()
      );
      const fd = await signer.provider!.getFeeData();
      const price = fd.gasPrice ?? fd.maxFeePerGas ?? 0n;
      if (price === 0n) {
        setGasText('Coût estimé du Gas : —');
        return;
      }
      setGasText(`Coût estimé du Gas : ${formatEther(gas * price)} ETH (${chainDisplayName(chainId)})`);
    } catch {
      setGasText('Coût estimé du Gas : — (impossible à estimer)');
    }
  }, [fileHash, studentId, studentWallet, fullName, filiere, year, chainId]);

  useEffect(() => {
    const t = window.setTimeout(() => void estimateGas(), 500);
    return () => window.clearTimeout(t);
  }, [estimateGas]);

  if (!isConfigured()) {
    return <p className="text-sm">Configuration manquante.</p>;
  }
  if (status !== 'connected') return <Navigate to="/admin" replace />;
  if (loading) return <p className="animate-pulse text-sm">Chargement des droits…</p>;
  if (!isAdmin) {
    return <p className="text-sm text-red-700">Accès refusé.</p>;
  }

  const submitPublish = async () => {
    if (!window.ethereum || !fileHash || !file || !studentId.trim() || !fullName.trim()) {
      setErr('Complétez le formulaire et le PDF.');
      return;
    }
    setConfirmOpen(false);
    setErr(null);
    setTxPhase('sign');
    try {
      const { pdfCid, jsonCid } = await pinDiplomaPayload(file, {
        studentId: studentId.trim(),
        studentName: fullName.trim(),
        filiere,
        yearObtained: year.trim(),
      });
      const ipfsCombined = `${jsonCid}:${pdfCid}`;
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const c = getSignerContract(signer);
      const tx = await c.addDiploma(
        fileHash,
        studentId.trim(),
        studentWallet.trim(),
        ipfsCombined,
        fullName.trim(),
        filiere,
        year.trim()
      );
      setTxPhase('confirm');
      const receipt = await tx.wait();
      const txHash = receipt?.hash ?? tx.hash;
      setTxPhase('done');
      navigate(`/admin/gestion?issued=1&tx=${encodeURIComponent(txHash)}`);
    } catch (e: unknown) {
      setTxPhase('error');
      setErr(e instanceof Error ? e.message : 'Transaction échouée');
    }
  };

  return (
    <div className="animate-fade-in space-y-8">
      <nav className="text-xs text-slate-600 dark:text-slate-400">
        <Link to="/" className="hover:underline">
          Accueil
        </Link>
        <span className="mx-2">›</span>
        <Link to="/admin/gestion" className="hover:underline">
          Dashboard Admin
        </Link>
        <span className="mx-2">›</span>
        <span className="font-semibold text-slate-900 dark:text-slate-100">Émettre un diplôme</span>
      </nav>

      <section className="border-2 border-dashed border-slate-400 bg-white p-6 dark:border-slate-600 dark:bg-slate-900">
        <h2 className="border-b border-dashed border-slate-300 pb-2 text-sm font-bold uppercase dark:border-slate-600">
          1. Informations étudiant
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span>Nom complet</span>
            <input
              className="mt-1 w-full border-2 border-dashed border-slate-300 bg-white px-2 py-2 dark:border-slate-600 dark:bg-slate-950"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            <span>ID Étudiant</span>
            <input
              className="mt-1 w-full border-2 border-dashed border-slate-300 bg-white px-2 py-2 dark:border-slate-600 dark:bg-slate-950"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span>Filière</span>
            <select
              className="mt-1 w-full border-2 border-dashed border-slate-300 bg-white px-2 py-2 dark:border-slate-600 dark:bg-slate-950"
              value={filiere}
              onChange={(e) => setFiliere(e.target.value)}
            >
              {FILIERES_OPTIONS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span>Année d’obtention</span>
            <input
              className="mt-1 w-full border-2 border-dashed border-slate-300 bg-white px-2 py-2 dark:border-slate-600 dark:bg-slate-950"
              value={year}
              onChange={(e) => setYear(e.target.value)}
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span>Adresse wallet étudiant</span>
            <input
              className="mt-1 w-full border-2 border-dashed border-slate-300 bg-white px-2 py-2 font-mono text-xs dark:border-slate-600 dark:bg-slate-950"
              value={studentWallet}
              onChange={(e) => setStudentWallet(e.target.value)}
              placeholder="0x…"
            />
          </label>
        </div>
      </section>

      <section className="border-2 border-dashed border-slate-400 bg-white p-6 dark:border-slate-600 dark:bg-slate-900">
        <h2 className="border-b border-dashed border-slate-300 pb-2 text-sm font-bold uppercase dark:border-slate-600">
          2. Document PDF
        </h2>
        <div
          role="presentation"
          className="mt-4 flex cursor-pointer flex-col items-center border-2 border-dashed border-slate-400 py-12 dark:border-slate-500"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files[0];
            if (f?.type === 'application/pdf') void onDrop(f);
            else setErr('PDF requis.');
          }}
          onClick={() => document.getElementById('adm-pdf')?.click()}
        >
          <input
            id="adm-pdf"
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => void onDrop(e.target.files?.[0] ?? null)}
          />
          <span className="text-3xl">⬆</span>
          <p className="mt-2 text-center text-sm">
            Glissez-déposez le diplôme PDF ici ou{' '}
            <span className="font-semibold underline">Parcourir les fichiers</span>
          </p>
        </div>
        {file && fileHash ? (
          <div className="mt-4 border border-dashed border-slate-300 p-3 text-sm dark:border-slate-600">
            <p>
              Fichier : <strong>{file.name}</strong>
            </p>
            <p className="mt-1 font-mono text-xs">
              Hash : {fileHash.slice(0, 6)}…{fileHash.slice(-6)}
            </p>
          </div>
        ) : null}
      </section>

      <section className="border-2 border-dashed border-slate-400 bg-white p-6 dark:border-slate-600 dark:bg-slate-900">
        <h2 className="border-b border-dashed border-slate-300 pb-2 text-sm font-bold uppercase dark:border-slate-600">
          3. Validation
        </h2>
        <p className="mt-4 text-sm">{gasText ?? 'Coût estimé du Gas : —'}</p>
        {err ? <p className="mt-3 text-sm text-red-700 dark:text-red-400">{err}</p> : null}
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => navigate('/admin/gestion')}
            className="border-2 border-dashed border-slate-400 px-6 py-2 text-sm font-bold uppercase hover:bg-slate-100 dark:border-slate-500 dark:hover:bg-slate-800"
          >
            Annuler
          </button>
          <button
            type="button"
            disabled={txPhase === 'sign' || txPhase === 'confirm'}
            onClick={() => setConfirmOpen(true)}
            className="border-2 border-dashed border-slate-900 bg-slate-900 px-6 py-2 text-sm font-bold uppercase text-white hover:bg-slate-800 disabled:opacity-50 dark:border-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
          >
            {txPhase === 'sign'
              ? 'En attente de signature…'
              : txPhase === 'confirm'
                ? 'Confirmation réseau…'
                : 'Certifier sur blockchain'}
          </button>
        </div>
      </section>

      <Modal
        open={confirmOpen}
        title="Confirmation"
        onClose={() => setConfirmOpen(false)}
        footer={
          <>
            <button
              type="button"
              onClick={() => setConfirmOpen(false)}
              className="border border-dashed px-4 py-2 text-sm"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={() => void submitPublish()}
              className="border border-dashed border-slate-900 bg-slate-900 px-4 py-2 text-sm text-white dark:border-white dark:bg-white dark:text-slate-900"
            >
              Certifier définitivement
            </button>
          </>
        }
      >
        <p>
          Vous allez certifier le diplôme de <strong>{fullName || '…'}</strong>. Action irréversible.
        </p>
        <ul className="mt-2 list-disc pl-5 text-sm">
          <li>CNE : {studentId || '—'}</li>
          <li>Wallet : {studentWallet ? shortenAddress(studentWallet) : '—'}</li>
        </ul>
      </Modal>
    </div>
  );
}
