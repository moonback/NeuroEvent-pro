import React from 'react';
import { Plus, QrCode, PenTool, Phone, Navigation, X, Zap } from 'lucide-react';
import type { Client, Mission } from '../../types';
import { triggerVibrate } from './useTechDashboard';

interface TechFABProps {
  /** Mission sélectionnée (peut être null si aucune ouverte). */
  selectedMission: Mission | null;
  /** Fiche client associée à la mission sélectionnée (peut être null). */
  selectedClient: Client | null;
  /** Ouvre le scanner QR. */
  onOpenScanner: () => void;
  /** Ouvre le pad de signature. */
  onOpenSignature: () => void;
}

interface FabAction {
  id: 'scanner' | 'signature' | 'call' | 'directions';
  label: string;
  icon: React.ElementType;
  color: string;
  /** Pré-condition d'activation. False = bouton grisé. */
  enabled: boolean;
  /** Raison de désactivation (pour aria-label / tooltip). */
  disabledReason?: string;
  onTrigger: () => void;
}

/**
 * FAB (Floating Action Button) style Uber Driver avec menu radial.
 * - Tap simple sur le bouton : ouvre/ferme le menu
 * - Backdrop blur semi-transparent pour fermer au tap extérieur
 * - 4 actions disposées en éventail (haut-droite → bas-droite)
 * - Animations cubic-bezier (spring) à l'ouverture/fermeture
 * - Vibration haptique à chaque interaction
 *
 * Le FAB n'est pas un raccourci "ajouter une mission" (rôle admin) — c'est
 * une **boîte à outils contextuelle** pour le technicien en mission.
 */
export default function TechFAB({
  selectedMission,
  selectedClient,
  onOpenScanner,
  onOpenSignature,
}: TechFABProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  // Ferme le menu quand la mission change (ex: drawer fermé).
  React.useEffect(() => {
    if (!selectedMission) setIsOpen(false);
  }, [selectedMission]);

  // Ferme au Escape (accessibilité).
  React.useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen]);

  const clientPhone = selectedClient?.phone?.trim() || null;
  const missionAddress = selectedMission?.address?.trim() || null;

  const actions: FabAction[] = [
    {
      id: 'scanner',
      label: 'Scanner QR',
      icon: QrCode,
      color: '#4d9fff',
      enabled: true,
      onTrigger: () => {
        onOpenScanner();
        setIsOpen(false);
      },
    },
    {
      id: 'signature',
      label: 'Signature',
      icon: PenTool,
      color: '#00e5a0',
      enabled: !!selectedMission,
      disabledReason: 'Ouvrez une mission pour gérer la signature',
      onTrigger: () => {
        onOpenSignature();
        setIsOpen(false);
      },
    },
    {
      id: 'call',
      label: 'Appeler client',
      icon: Phone,
      color: '#ffb700',
      enabled: !!clientPhone,
      disabledReason: !selectedClient
        ? 'Aucune fiche client liée'
        : 'Numéro de téléphone non renseigné',
      onTrigger: () => {
        if (!clientPhone) return;
        // window.location.href déclenche l'app téléphone native (iOS/Android/desktop)
        window.location.href = `tel:${clientPhone.replace(/\s/g, '')}`;
        setIsOpen(false);
      },
    },
    {
      id: 'directions',
      label: 'Itinéraire',
      icon: Navigation,
      color: '#ff4d6d',
      enabled: !!missionAddress,
      disabledReason: 'Adresse de mission non renseignée',
      onTrigger: () => {
        if (!missionAddress) return;
        // iOS → maps://, Android → geo: URI, fallback → Google Maps web
        const encoded = encodeURIComponent(missionAddress);
        const userAgent = navigator.userAgent.toLowerCase();
        if (/iphone|ipad|ipod/.test(userAgent)) {
          window.location.href = `maps://?q=${encoded}`;
        } else if (/android/.test(userAgent)) {
          window.location.href = `geo:0,0?q=${encoded}`;
        } else {
          window.open(`https://www.google.com/maps/search/?api=1&query=${encoded}`, '_blank', 'noopener');
        }
        setIsOpen(false);
      },
    },
  ];

  const handleToggle = () => {
    triggerVibrate('click');
    setIsOpen((v) => !v);
  };

  return (
    <>
      {/* Backdrop (uniquement quand ouvert) */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          style={{
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            animation: 'tech-fab-fade-in 0.2s ease-out',
          }}
          onClick={() => {
            triggerVibrate('click');
            setIsOpen(false);
          }}
          aria-hidden
        />
      )}

      {/* Conteneur du FAB + menu radial */}
      <div
        className="fixed z-50"
        style={{
          // Au-dessus de la bottom nav (60px) + safe area + 16px d'air
          bottom: 'calc(76px + env(safe-area-inset-bottom, 0px))',
          right: 'max(16px, env(safe-area-inset-right, 0px))',
        }}
      >
        {/* Actions en éventail (en bas du bouton, vers le haut) */}
        <div className="flex flex-col items-end gap-3 mb-3">
          {actions.map((action, idx) => {
            const Icon = action.icon;
            // Délai d'apparition en cascade (du bas vers le haut : 0, 40, 80, 120ms)
            const delay = (actions.length - 1 - idx) * 40;
            return (
              <div
                key={action.id}
                className="flex items-center gap-3"
                style={{
                  // État initial : décalé vers le bas + opacité 0
                  transform: isOpen ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.6)',
                  opacity: isOpen ? 1 : 0,
                  pointerEvents: isOpen ? 'auto' : 'none',
                  transition: `transform 0.32s cubic-bezier(0.16,1,0.3,1) ${delay}ms, opacity 0.2s ease ${delay}ms`,
                }}
              >
                {/* Label tooltip */}
                <div
                  className="px-2.5 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider whitespace-nowrap"
                  style={{
                    background: 'rgba(13,17,28,0.95)',
                    color: action.enabled ? 'var(--tech-text)' : 'var(--tech-text-muted)',
                    border: `1px solid ${action.color}30`,
                    boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                  }}
                >
                  {action.label}
                </div>

                {/* Bouton d'action */}
                <button
                  type="button"
                  disabled={!action.enabled}
                  onClick={() => {
                    if (!action.enabled) {
                      triggerVibrate('error');
                      return;
                    }
                    triggerVibrate('success');
                    action.onTrigger();
                  }}
                  title={action.enabled ? action.label : action.disabledReason}
                  aria-label={action.enabled ? action.label : `${action.label} (${action.disabledReason})`}
                  className="w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer transition-all active:scale-90"
                  style={{
                    background: action.enabled
                      ? `linear-gradient(135deg, ${action.color} 0%, ${action.color}cc 100%)`
                      : 'rgba(255,255,255,0.04)',
                    color: action.enabled ? '#fff' : 'var(--tech-text-muted)',
                    border: action.enabled
                      ? `1px solid ${action.color}80`
                      : '1px solid var(--tech-border)',
                    boxShadow: action.enabled
                      ? `0 8px 20px ${action.color}40, 0 0 12px ${action.color}25`
                      : 'none',
                    opacity: action.enabled ? 1 : 0.5,
                  }}
                >
                  <Icon className="w-5 h-5" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Bouton principal (toggle) */}
        <button
          type="button"
          onClick={handleToggle}
          aria-label={isOpen ? 'Fermer le menu d\'actions rapides' : 'Ouvrir le menu d\'actions rapides'}
          aria-expanded={isOpen}
          className="w-14 h-14 rounded-2xl flex items-center justify-center cursor-pointer transition-all active:scale-90"
          style={{
            background: isOpen
              ? 'linear-gradient(135deg, rgba(255,77,109,0.95) 0%, rgba(255,77,109,0.8) 100%)'
              : 'linear-gradient(135deg, var(--tech-accent) 0%, var(--tech-accent-dim, #00b882) 100%)',
            color: '#fff',
            border: isOpen
              ? '1px solid rgba(255,77,109,0.4)'
              : '1px solid rgba(0,229,160,0.4)',
            boxShadow: isOpen
              ? '0 8px 24px rgba(255,77,109,0.4), 0 0 16px rgba(255,77,109,0.25)'
              : '0 8px 24px rgba(0,229,160,0.35), 0 0 16px rgba(0,229,160,0.2)',
            transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
            transition: 'transform 0.3s cubic-bezier(0.16,1,0.3,1), background 0.2s, box-shadow 0.2s',
          }}
        >
          {isOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Zap className="w-6 h-6" style={{ filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.4))' }} />
          )}
        </button>
      </div>
    </>
  );
}
