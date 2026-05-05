import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white/80 py-8 text-center text-sm text-slate-600 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80 dark:text-slate-400">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-center gap-2 sm:flex-row sm:gap-6">
        <span>Blockchain Diploma Verifier · EMSI</span>
        <Link to="/verify" className="text-violet-600 hover:underline dark:text-violet-400">
          Portail public de vérification
        </Link>
        <a
          href="https://docs.metamask.io/"
          className="text-violet-600 hover:underline dark:text-violet-400"
          target="_blank"
          rel="noopener noreferrer"
        >
          Aide MetaMask
        </a>
      </div>
    </footer>
  );
}
