import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useToastStore, ToastType, ToastItem as ToastItemData } from '../../store/toast';
import { cn } from '../../lib/utils';
import { useDrag } from '../../hooks/useSwipeGestures';
import { triggerVibrate } from '../technician/useTechDashboard';

const styles: Record<ToastType, string> = {
  success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  error: 'bg-red-50 border-red-200 text-red-700',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
};

const icons: Record<ToastType, React.ElementType> = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

/* ------------------------------------------------------------------ */
/*  ToastItem (swipe-to-dismiss)                                      */
/* ------------------------------------------------------------------ */

interface ToastItemProps {
  toast: ToastItemData;
  onDismiss: (id: string) => void;
}

/**
 * Toast individuel avec swipe-to-dismiss.
 * - Swipe horizontal ≥ 100px (ou ≥ 40% de la largeur) → dismiss
 * - Snap-back animé sinon
 * - Opacité décroît proportionnellement à l'offset (effet "fading away")
 * - Vibration haptique au déclenchement du dismiss
 * - Tap sur le bouton X toujours possible (accessibilité clavier/souris)
 */
function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const { ref, offset, isDragging, handlers } = useDrag<HTMLDivElement>({
    axis: 'x',
    enabled: true,
    onDragEnd: (dx, _dy, durationMs) => {
      const absDx = Math.abs(dx);
      const w = ref.current?.offsetWidth ?? 320;
      const velocity = absDx / Math.max(1, durationMs);
      // Seuil "distance" : 100px OU 40% de la largeur
      // OU seuil "vitesse" : fling rapide ≥ 0.5 px/ms
      const isFling = velocity >= 0.5;
      const isFarEnough = absDx >= 100 || absDx >= w * 0.4;
      if (isFling || isFarEnough) {
        triggerVibrate('success');
        onDismiss(toast.id);
      }
    },
  });

  const dx = offset.x;
  // Pendant le drag on garde l'offset tel quel (suit le doigt).
  // Au relâché non-dismissé, isDragging passe à false → offset visuellement 0
  // via la transition CSS (snap-back).
  const dragOffsetX = isDragging ? dx : 0;
  const absDx = Math.abs(dx);
  // Opacité décroît à partir de 60px : 1 → 0 sur 60..140px
  const opacity = isDragging ? Math.max(0, 1 - (absDx - 60) / 80) : 1;

  const Icon = icons[toast.type];

  return (
    <div
      ref={ref}
      role="status"
      className={cn(
        'pointer-events-auto flex items-start gap-2 rounded-lg border p-3 shadow-md text-sm font-medium select-none',
        styles[toast.type],
      )}
      style={{
        transform: `translateX(${dragOffsetX}px)`,
        opacity,
        // Pas de transition pendant le drag (sinon ça "lèche" le doigt) ;
        // transition au relâché pour le snap-back + fade final.
        transition: isDragging
          ? 'none'
          : 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s',
        touchAction: 'pan-y',
        willChange: 'transform, opacity',
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      {...handlers}
    >
      <Icon className="w-4 h-4 shrink-0 mt-0.5" />
      <span className="flex-1">{toast.message}</span>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDismiss(toast.id);
        }}
        onTouchStart={(e) => e.stopPropagation() /* pas de drag si tap sur X */}
        aria-label="Fermer la notification"
        className="opacity-60 hover:opacity-100 transition-opacity shrink-0 p-1 -m-1"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Toaster (conteneur)                                               */
/* ------------------------------------------------------------------ */

export default function Toaster() {
  const toasts = useToastStore(state => state.toasts);
  const dismiss = useToastStore(state => state.dismiss);

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-full max-w-sm pointer-events-none print:hidden"
      aria-live="polite"
    >
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
      ))}
    </div>
  );
}
