import { Link } from 'react-router-dom';

type WireframeRow = {
  id: string;
  title: string;
  to?: string;
  note?: string;
};

const WIREFRAMES: WireframeRow[] = [
  { id: '001', title: 'Diagramme UML / architecture', note: 'Couverture fonctionnelle dans l’app (pas d’écran dédié).' },
  { id: '002', title: 'Connexion administration', to: '/admin' },
  { id: '003', title: 'Émission d’un diplôme', to: '/admin/emit' },
  { id: '004', title: 'Gestion des diplômes & révocation', to: '/admin/gestion' },
  { id: '005', title: 'Portefeuille étudiant (Mes diplômes)', to: '/student' },
  {
    id: '006',
    title: 'Page preuve / attestation',
    note: 'Depuis l’espace étudiant : lien « Voir » vers /diploma/:hash.',
  },
  { id: '007', title: 'Vérification — analyse du document', to: '/verify' },
  { id: '008', title: 'Résultat : authentique', to: '/verify' },
  { id: '009', title: 'Résultat : révoqué', to: '/verify' },
  { id: '010', title: 'Résultat : non trouvé', to: '/verify' },
  { id: '011', title: 'Flux complémentaires vérification', to: '/verify' },
];

export function GuidePage() {
  return (
    <div className="prose prose-slate mx-auto max-w-2xl dark:prose-invert">
      <h1>Guide rapide</h1>
      <p>
        Ce prototype illustre la certification de diplômes sur une blockchain EVM (Sepolia ou Ganache local)
        avec MetaMask.
      </p>
      <h2>Correspondance maquettes (fichiers PNG Aspose)</h2>
      <ol className="not-prose list-decimal space-y-2 pl-5 text-sm">
        {WIREFRAMES.map((w) => (
          <li key={w.id} className="text-slate-700 dark:text-slate-300">
            <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">{w.id}</span>
            {' — '}
            {w.to != null ? (
              <Link to={w.to} className="font-medium text-violet-700 underline hover:no-underline dark:text-violet-400">
                {w.title}
              </Link>
            ) : (
              <span>{w.title}</span>
            )}
            {w.note != null ? <span className="mt-0.5 block text-xs text-slate-500">{w.note}</span> : null}
          </li>
        ))}
      </ol>
      <ul>
        <li>
          <strong>École</strong> : menu Administration — émission et révocation.
        </li>
        <li>
          <strong>Étudiant</strong> : connectez le wallet indiqué lors de l’émission pour voir vos titres.
        </li>
        <li>
          <strong>Vérificateur</strong> : page publique — déposez le PDF ou saisissez un hash / ID.
        </li>
      </ul>
      <p>
        <Link to="/verify">→ Portail de vérification</Link>
      </p>
      <p>
        <Link to="/">← Accueil</Link>
      </p>
    </div>
  );
}
