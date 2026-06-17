import React from 'react';
import { AlertTriangle, Info } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  /** Titre affiché en haut de la modale */
  title: string;
  /** Message de description / avertissement */
  message: string;
  /** Libellé du bouton de confirmation (défaut : "Confirmer") */
  confirmLabel?: string;
  /** Libellé du bouton d'annulation (défaut : "Annuler") */
  cancelLabel?: string;
  /** Variante visuelle du bouton de confirmation */
  variant?: 'danger' | 'warning' | 'info';
  /** Appelé quand l'utilisateur confirme */
  onConfirm: () => void;
  /** Appelé quand l'utilisateur annule ou ferme */
  onCancel: () => void;
}

/**
 * Remplace window.confirm() par une modale stylée, accessible et non bloquante.
 * Usage :
 *   const [confirmOpen, setConfirmOpen] = useState(false);
 *   <ConfirmModal
 *     isOpen={confirmOpen}
 *     title="Supprimer ?"
 *     message="Cette action est définitive."
 *     variant="danger"
 *     confirmLabel="Supprimer"
 *     onConfirm={() => { doDelete(); setConfirmOpen(false); }}
 *     onCancel={() => setConfirmOpen(false)}
 *   />
 */
export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  // Fermeture clavier
  React.useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      iconBg: 'bg-red-50',
      iconColor: 'text-red-600',
      btnBg: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
      Icon: AlertTriangle,
    },
    warning: {
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
      btnBg: 'bg-amber-500 hover:bg-amber-600 focus:ring-amber-400',
      Icon: AlertTriangle,
    },
    info: {
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
      btnBg: 'bg-[#2563eb] hover:bg-blue-700 focus:ring-blue-500',
      Icon: Info,
    },
  }[variant];

  const { Icon } = variantStyles;

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      aria-describedby="confirm-modal-desc"
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-in zoom-in-95 duration-150">
        {/* Icône */}
        <div className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full ${variantStyles.iconBg}`}>
          <Icon className={`h-6 w-6 ${variantStyles.iconColor}`} aria-hidden="true" />
        </div>

        {/* Textes */}
        <h3
          id="confirm-modal-title"
          className="text-center text-base font-bold text-[#0f172a] mb-2"
        >
          {title}
        </h3>
        <p
          id="confirm-modal-desc"
          className="text-center text-sm text-[#64748b] leading-relaxed whitespace-pre-wrap"
        >
          {message}
        </p>

        {/* Actions */}
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl border border-[#e2e8f0] px-4 py-2.5 text-sm font-semibold text-[#1e293b] hover:bg-[#f1f5f9] transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 ${variantStyles.btnBg}`}
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
