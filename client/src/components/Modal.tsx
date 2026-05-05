import type { ReactNode } from 'react';

type Props = {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  footer?: ReactNode;
};

export function Modal({ open, title, children, onClose, footer }: Props) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900">
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 id="modal-title" className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            aria-label="Fermer"
          >
            ×
          </button>
        </div>
        <div className="text-sm text-slate-700 dark:text-slate-300">{children}</div>
        {footer ? <div className="mt-6 flex justify-end gap-2">{footer}</div> : null}
      </div>
    </div>
  );
}
