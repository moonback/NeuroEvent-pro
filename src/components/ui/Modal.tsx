import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
}

/**
 * Modale partagée : rôle dialog, fermeture par Échap et clic sur l'arrière-plan,
 * en-tête et pied homogènes sur toute l'application.
 */
export default function Modal({ isOpen, onClose, title, children, footer, maxWidth = 'max-w-md' }: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-gray-900/50 backdrop-blur-sm p-0 sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'bg-white shadow-xl w-full flex flex-col overflow-hidden',
          'rounded-t-2xl sm:rounded-xl max-h-[92vh] sm:max-h-[90vh]',
          maxWidth
        )}
      >
        <div className="flex justify-between items-center p-4 sm:p-6 border-b border-[#e2e8f0] shrink-0">
          <h2 className="text-base sm:text-lg font-bold text-[#0f172a] uppercase tracking-tight">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Fermer" className="p-1 -mr-1 text-[#94a3b8] hover:text-[#64748b]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto flex-1">{children}</div>

        {footer && <div className="p-4 sm:p-6 border-t border-[#e2e8f0] bg-[#f8fafc] shrink-0">{footer}</div>}
      </div>
    </div>
  );
}
