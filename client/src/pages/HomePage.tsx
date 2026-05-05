import { Link } from 'react-router-dom';
import { isConfigured } from '../lib/config';

export function HomePage() {
  const ready = isConfigured();

  return (
    <div className="animate-fade-in space-y-10">
      <section className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-600 to-indigo-700 p-10 text-white shadow-lg dark:border-violet-900/60">
        <p className="text-sm uppercase tracking-wide text-violet-200">
          Certification décentralisée
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          Blockchain Diploma Verifier
        </h1>
        <p className="mt-4 max-w-2xl text-violet-100">
          Ancrage cryptographique des diplômes, vérification publique instantanée et espace sécurisé
          pour l’école et les étudiants — conception décrite dans le cahier des charges blockchain.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/verify"
            className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-violet-700 shadow hover:bg-violet-50"
          >
            Vérifier un diplôme
          </Link>
          <Link
            to="/admin"
            className="rounded-lg border border-white/40 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/20"
          >
            Espace administration
          </Link>
          <Link
            to="/student"
            className="rounded-lg border border-white/40 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/20"
          >
            Espace étudiant
          </Link>
        </div>
      </section>

      {!ready ? (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
          <p className="font-medium">Configuration requise</p>
          <p className="mt-1 text-sm">
            Copiez <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/60">client/.env.example</code>{' '}
            vers <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/60">.env</code> et renseignez{' '}
            <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/60">VITE_CONTRACT_ADDRESS</code> après
            déploiement du contrat.
          </p>
        </div>
      ) : null}

      <section className="rounded-xl border border-slate-200 bg-slate-50/80 p-6 dark:border-slate-800 dark:bg-slate-900/50">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
          Parcours maquettes (002–011)
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Accès direct aux écrans alignés sur les captures du cahier des charges.
        </p>
        <ul className="mt-4 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
          {[
            { label: '002 — Connexion admin', to: '/admin' },
            { label: '003 — Émission diplôme', to: '/admin/emit' },
            { label: '004 — Gestion & révocation', to: '/admin/gestion' },
            { label: '005 — Portefeuille étudiant', to: '/student' },
            { label: '006 — Preuve (après émission)', hint: 'Ouvrir un diplôme depuis l’espace étudiant' },
            { label: '007–011 — Vérification publique', to: '/verify' },
            { label: 'Guide', to: '/guide' },
          ].map((item) =>
            item.to ? (
              <li key={item.label}>
                <Link
                  to={item.to}
                  className="block rounded-lg border border-slate-200 bg-white px-3 py-2 font-medium text-violet-700 transition hover:border-violet-300 hover:bg-violet-50 dark:border-slate-700 dark:bg-slate-900 dark:text-violet-400 dark:hover:border-violet-600 dark:hover:bg-slate-800"
                >
                  {item.label} →
                </Link>
              </li>
            ) : (
              <li
                key={item.label}
                className="rounded-lg border border-dashed border-slate-300 px-3 py-2 text-slate-500 dark:border-slate-600 dark:text-slate-400"
              >
                {item.label}
                {item.hint ? <span className="mt-1 block text-xs">{item.hint}</span> : null}
              </li>
            )
          )}
        </ul>
      </section>

      <section className="grid gap-6 sm:grid-cols-3">
        {[
          {
            title: 'Administration',
            body: 'Connexion MetaMask, émission PDF + hash SHA-256, ancrage on-chain et révocation sécurisée.',
            to: '/admin',
          },
          {
            title: 'Étudiant',
            body: 'Consultation par adresse wallet, QR / lien public, téléchargement et attestation avec TX.',
            to: '/student',
          },
          {
            title: 'Vérification publique',
            body: 'Glisser-déposer ou recherche par identifiant, avec statut certifié / révoqué / inexistant.',
            to: '/verify',
          },
        ].map((c) => (
          <Link
            key={c.title}
            to={c.to}
            className="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-violet-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
          >
            <h2 className="text-lg font-semibold text-slate-900 group-hover:text-violet-700 dark:text-slate-100 dark:group-hover:text-violet-400">
              {c.title}
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{c.body}</p>
            <span className="mt-4 inline-flex text-sm font-medium text-violet-600 dark:text-violet-400">
              Ouvrir →
            </span>
          </Link>
        ))}
      </section>
    </div>
  );
}
