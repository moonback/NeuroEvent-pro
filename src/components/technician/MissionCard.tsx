import React from 'react';
import { Clock, MapPin, Truck as TruckIcon, Users, ChevronRight, CheckCircle2, Play, Info, ChevronLeft } from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { triggerVibrate } from './useTechDashboard';
import { useAuthStore } from '../../store/auth';
import { useStore } from '../../store';
import { useDrag } from '../../hooks/useSwipeGestures';

interface MissionCardProps {
  mission: {
    id: string;
    title: string;
    client: string;
    type: string;
    status: string;
    color: string;
    address: string;
    start: Date;
    end: Date;
    truckId?: string;
    technicianIds: string[];
    equipments: { equipmentId: string; quantity: number; checked?: boolean }[];
    signatureUrl?: string;
  };
  truckName: string;
  colleagueCount: number;
  onClick: () => void;
  onQuickAction?: (newStatus: 'En cours' | 'Terminée') => void;
}

/**
 * Seuils (en pixels) du geste swipe.
 * - threshold : distance à partir de laquelle on "arme" l'action (changement visuel)
 * - trigger   : distance à partir de laquelle on déclenche l'action au relâché
 * - max       : course max de l'offset (au-delà, l'offset est clampé)
 */
const SWIPE_THRESHOLD = 60;
const SWIPE_TRIGGER = 110;
const SWIPE_MAX = 140;

export default function MissionCard({ mission, truckName, colleagueCount, onClick, onQuickAction }: MissionCardProps) {
  const [isHovered, setIsHovered] = React.useState(false);
  const [tapStart, setTapStart] = React.useState<{ x: number; y: number; t: number } | null>(null);
  const isToday = isSameDay(mission.start, new Date());
  const user = useAuthStore(state => state.user);
  const technicians = useStore(state => state.technicians);
  const currentTech = technicians.find(t => t.id === user?.id);
  const isChecklistEnabled = currentTech?.checklistEnabled ?? false;

  const [checkedChecklist, setCheckedChecklist] = React.useState(0);
  const totalChecklist = 15;

  React.useEffect(() => {
    if (user?.id && mission.id) {
      const saved = localStorage.getItem(`eventflow_checklist_${user.id}_${mission.id}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setCheckedChecklist(Object.values(parsed).filter(Boolean).length);
        } catch {}
      }
    }
  }, [user?.id, mission.id]);

  const checklistPercent = totalChecklist > 0 ? Math.round((checkedChecklist / totalChecklist) * 100) : 0;

  const getEquipmentProgress = () => {
    if (!mission.equipments || mission.equipments.length === 0) return null;
    const total = mission.equipments.length;
    const pointed = mission.equipments.filter((e) => e.checked).length;
    return { total, pointed, percent: Math.round((pointed / total) * 100) };
  };

  const progress = getEquipmentProgress();

  const getStatusConfig = () => {
    switch (mission.status) {
      case 'Planifiée':
        return {
          badgeBg: 'rgba(77, 159, 255, 0.08)',
          badgeBorder: '1px solid rgba(77, 159, 255, 0.18)',
          textColor: 'var(--tech-blue)',
          dotColor: 'var(--tech-blue)',
          ping: true,
        };
      case 'En cours':
        return {
          badgeBg: 'rgba(255, 183, 0, 0.08)',
          badgeBorder: '1px solid rgba(255, 183, 0, 0.18)',
          textColor: '#ffb700',
          dotColor: '#ffb700',
          ping: true,
        };
      case 'Terminée':
        return {
          badgeBg: 'rgba(0, 229, 160, 0.08)',
          badgeBorder: '1px solid rgba(0, 229, 160, 0.18)',
          textColor: 'var(--tech-accent)',
          dotColor: 'var(--tech-accent)',
          ping: false,
        };
      default:
        return {
          badgeBg: 'rgba(255, 255, 255, 0.04)',
          badgeBorder: '1px solid rgba(255, 255, 255, 0.08)',
          textColor: 'var(--tech-text-muted)',
          dotColor: 'var(--tech-text-muted)',
          ping: false,
        };
    }
  };

  const badgeConfig = getStatusConfig();

  // ── Refs utilitaires (doivent être déclarés AVANT le hook qui les consomme) ─
  const vibratedRef = React.useRef(false);

  // ── Swipe : on utilise useDrag limité à l'axe X ─────────────────────
  // L'offset est clampé à ±SWIPE_MAX. Si l'utilisateur relâche au-delà
  // du seuil de déclenchement, l'action est appelée. Sinon, snap-back
  // automatique via la transition CSS (isDragging passe à false → 0).
  const { ref, offset, isDragging, handlers: dragHandlers } = useDrag<HTMLDivElement>({
    axis: 'x',
    enabled: true,
    onDrag: (dx) => {
      // Vibration au premier franchissement de SWIPE_THRESHOLD
      if (Math.abs(dx) >= SWIPE_THRESHOLD && !vibratedRef.current) {
        vibratedRef.current = true;
        triggerVibrate('click');
      }
    },
    onDragEnd: (dx) => {
      vibratedRef.current = false;
      const absDx = Math.abs(dx);
      const direction: 'left' | 'right' = dx > 0 ? 'right' : 'left';
      if (absDx >= SWIPE_TRIGGER) {
        triggerVibrate('success');
        if (direction === 'right') {
          // Swipe → droite = action rapide (Démarrer / Terminer)
          if (['Planifiée', 'En cours'].includes(mission.status) && onQuickAction) {
            const nextStatus = mission.status === 'Planifiée' ? 'En cours' : 'Terminée';
            onQuickAction(nextStatus);
          }
        } else {
          // Swipe → gauche = ouvrir les détails
          onClick();
        }
      }
      // Snap-back : isDragging passe à false → la transition CSS ramène à 0.
    },
  });

  // Pour forcer le retour à 0 de l'offset visuel, on laisse l'offset partir
  // tel quel et on le clip visuellement via transform. Le snap-back est piloté
  // par `isDragging` (transition CSS désactivée pendant le drag, animée au relâché).
  const dragOffsetX = isDragging
    ? Math.max(-SWIPE_MAX, Math.min(SWIPE_MAX, offset.x))
    : 0; // pendant le snap-back, on rend 0 et la transition joue

  const swipeArmedRight = dragOffsetX > SWIPE_THRESHOLD;
  const swipeArmedLeft = dragOffsetX < -SWIPE_THRESHOLD;
  const swipeTriggerRight = dragOffsetX > SWIPE_TRIGGER;
  const swipeTriggerLeft = dragOffsetX < -SWIPE_TRIGGER;

  // ── Tap (sans swipe) ────────────────────────────────────────────────
  // Si on relâche avec un offset quasi nul, c'est un tap → onClick.
  const handleTouchEnd = (e: React.TouchEvent) => {
    dragHandlers.onTouchEnd(e);
    if (!tapStart) return;
    const t = e.changedTouches[0];
    if (!t) return;
    const dx = t.clientX - tapStart.x;
    const dy = t.clientY - tapStart.y;
    const dt = Date.now() - tapStart.t;
    // Tap = mouvement < 10px, durée < 350ms, pas de drag
    if (Math.abs(dx) < 10 && Math.abs(dy) < 10 && dt < 350 && Math.abs(offset.x) < 10) {
      triggerVibrate('click');
      onClick();
    }
    setTapStart(null);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    dragHandlers.onTouchStart(e);
    const t = e.touches[0];
    if (t) setTapStart({ x: t.clientX, y: t.clientY, t: Date.now() });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    dragHandlers.onTouchMove(e);
  };

  // ── Action contextuelle (Démarrer / Terminer) ───────────────────────
  const canQuickAction = ['Planifiée', 'En cours'].includes(mission.status) && !!onQuickAction;
  const quickActionLabel = mission.status === 'Planifiée' ? 'Démarrer' : 'Terminer';
  const quickActionIcon = mission.status === 'Planifiée' ? Play : CheckCircle2;

  return (
    <div
      ref={ref}
      className="relative overflow-hidden rounded-2xl"
      style={{ touchAction: 'pan-y' /* laisse le scroll vertical libre */ }}
    >
      {/* ── COUCHE 0 : indicateurs de swipe permanents ── */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-between px-2 z-10" aria-hidden>
        <ChevronLeft className="w-5 h-5 text-white/90" />
        <ChevronRight className="w-5 h-5 text-white/90" />
      </div>

      {/* ── COUCHE 1 : fond révélé au swipe ─────────────────────────── */}
      <div
        className="absolute inset-0 flex items-center justify-between pointer-events-none"
        aria-hidden
      >
        {/* Swipe → droite : action rapide (vert / mission color) */}
        <div
          className="h-full flex items-center pl-5 pr-3 transition-opacity"
          style={{
            background: `linear-gradient(270deg, ${mission.color}dd 0%, ${mission.color}99 100%)`,
            opacity: swipeArmedRight ? 1 : 0,
            transition: 'opacity 0.15s ease',
            width: SWIPE_MAX + 40,
          }}
        >
          <div className="flex items-center gap-2 text-white">
            {React.createElement(quickActionIcon, { className: 'w-5 h-5' })}
            <span className="text-xs font-black uppercase tracking-wider">
              {canQuickAction ? quickActionLabel : '—'}
            </span>
          </div>
        </div>

        {/* Swipe → gauche : détails (bleu tech) */}
        <div
          className="h-full flex items-center pr-5 pl-3 justify-end transition-opacity"
          style={{
            background: 'linear-gradient(90deg, rgba(77,159,255,0.85) 0%, rgba(77,159,255,0.65) 100%)',
            opacity: swipeArmedLeft ? 1 : 0,
            transition: 'opacity 0.15s ease',
            width: SWIPE_MAX + 40,
          }}
        >
          <div className="flex items-center gap-2 text-white">
            <span className="text-xs font-black uppercase tracking-wider">Détails</span>
            <Info className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ── COUCHE 2 : la carte, qui glisse avec le doigt ──────────── */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="tech-card overflow-hidden cursor-pointer relative active:scale-[0.99] rounded-2xl"
        style={{
          transform: `translateX(${dragOffsetX}px)`,
          transition: isDragging
            ? 'none'
            : 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s, border-color 0.3s',
          willChange: 'transform',
          borderColor: isHovered ? `${mission.color}45` : 'var(--tech-border)',
          boxShadow:
            (isHovered
              ? `0 12px 30px rgba(0, 0, 0, 0.55), 0 0 14px ${mission.color}15`
              : '0 4px 20px rgba(0,0,0,0.3)') +
            (swipeTriggerRight
              ? `, 0 0 24px ${mission.color}40`
              : swipeTriggerLeft
                ? ', 0 0 24px rgba(77,159,255,0.40)'
                : ''),
        }}
      >
        {/* Left accent gradient bar */}
        <div
          className="absolute left-0 top-0 bottom-0 w-[3px] z-10 transition-all duration-300"
          style={{
            background: isHovered
              ? `linear-gradient(180deg, ${mission.color}ff 0%, ${mission.color}88 100%)`
              : `linear-gradient(180deg, ${mission.color}bb 0%, ${mission.color}33 100%)`,
            boxShadow: isHovered ? `2px 0 12px ${mission.color}50` : `2px 0 6px ${mission.color}20`,
          }}
        />

        {/* Top right glow when active or hovered */}
        {(mission.status === 'En cours' || isHovered) && (
          <div
            className="absolute top-0 right-0 w-32 h-16 pointer-events-none transition-opacity duration-300"
            style={{
              background: `radial-gradient(ellipse at top right, ${mission.color}08 0%, transparent 70%)`,
            }}
          />
        )}

        <div className="p-4 pl-5">
          {/* Header */}
          <div className="flex justify-between items-start mb-3">
            <div className="min-w-0 flex-1 pr-2">
              {/* Tags row */}
              <div className="flex items-center gap-1.5 mb-1.5">
                <span
                  className="text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    color: 'var(--tech-text-muted)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  {mission.type}
                </span>
                {isToday && (
                  <span
                    className="text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider"
                    style={{
                      background: 'rgba(255,77,109,0.10)',
                      color: '#ff8fa0',
                      border: '1px solid rgba(255,77,109,0.15)',
                      animation: 'tech-pulse-glow 2s ease-in-out infinite',
                    }}
                  >
                    Aujourd'hui
                  </span>
                )}
              </div>

              {/* Title */}
              <h3
                className="font-extrabold text-sm leading-snug tracking-tight transition-colors duration-200"
                style={{ color: isHovered ? mission.color : 'var(--tech-text)' }}
              >
                {mission.title}
              </h3>
              {/* Client */}
              <p
                className="text-[11px] font-semibold mt-0.5 truncate"
                style={{ color: 'var(--tech-text-secondary)' }}
              >
                {mission.client}
              </p>
            </div>

            {/* Status badge */}
            <span
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black tracking-wide shrink-0 transition-all duration-200"
              style={{
                background: badgeConfig.badgeBg,
                border: badgeConfig.badgeBorder,
                color: badgeConfig.textColor,
              }}
            >
              <span
                className="relative w-1.5 h-1.5 rounded-full inline-block shrink-0"
                style={{ background: badgeConfig.dotColor }}
              >
                {badgeConfig.ping && (
                  <span
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: badgeConfig.dotColor,
                      animation: 'tech-dot-ping 2s cubic-bezier(0,0,0.2,1) infinite',
                    }}
                  />
                )}
              </span>
              {mission.status}
            </span>
          </div>

          {/* Info rows */}
          <div className="space-y-1.5 mb-3.5">
            <div
              className="flex items-center gap-2 text-[11px]"
              style={{ color: 'var(--tech-text-secondary)' }}
            >
              <Clock
                className="w-3.5 h-3.5 shrink-0"
                style={{ color: isToday ? '#ffb700' : 'var(--tech-text-muted)' }}
              />
              <span className={isToday ? 'font-bold text-amber-400' : 'font-medium'}>
                {format(mission.start, 'EEEE d MMM HH:mm', { locale: fr })} — {format(mission.end, 'HH:mm')}
              </span>
            </div>
            <div
              className="flex items-center gap-2 text-[11px]"
              style={{ color: 'var(--tech-text-secondary)' }}
            >
              <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--tech-text-muted)' }} />
              <span className="line-clamp-1 font-medium">{mission.address}</span>
            </div>
          </div>

          {/* Progress Grid */}
          {(progress || (isChecklistEnabled && checkedChecklist > 0)) && (
            <div className="grid grid-cols-2 gap-3 mb-3.5">
              {progress && (
                <div
                  className="p-2 rounded-xl transition-all duration-200"
                  style={{
                    background: 'rgba(255,255,255,0.015)',
                    border: isHovered ? `1px solid ${mission.color}15` : '1px solid var(--tech-border)',
                  }}
                >
                  <div className="flex justify-between text-[8px] font-black uppercase tracking-widest mb-1.5">
                    <span style={{ color: 'var(--tech-text-muted)' }}>Matériel</span>
                    <span style={{ color: progress.percent === 100 ? 'var(--tech-accent)' : 'var(--tech-text-secondary)' }}>
                      {progress.pointed}/{progress.total}
                    </span>
                  </div>
                  <div className="tech-progress-track h-[3px]">
                    <div
                      className="tech-progress-fill"
                      style={{
                        width: `${progress.percent}%`,
                        background: progress.percent === 100 ? 'var(--tech-accent)' : mission.color,
                        boxShadow: progress.percent === 100 ? '0 0 6px rgba(0,229,160,0.3)' : 'none',
                      }}
                    />
                  </div>
                </div>
              )}

              {isChecklistEnabled && (
                <div
                  className={`p-2 rounded-xl transition-all duration-200 ${!progress ? 'col-span-2' : ''}`}
                  style={{
                    background: 'rgba(255,255,255,0.015)',
                    border: isHovered ? `1px solid ${mission.color}15` : '1px solid var(--tech-border)',
                  }}
                >
                  <div className="flex justify-between text-[8px] font-black uppercase tracking-widest mb-1.5">
                    <span style={{ color: 'var(--tech-text-muted)' }}>Checklist</span>
                    <span style={{ color: checklistPercent === 100 ? 'var(--tech-accent)' : 'var(--tech-text-secondary)' }}>
                      {checkedChecklist}/{totalChecklist}
                    </span>
                  </div>
                  <div className="tech-progress-track h-[3px]">
                    <div
                      className="tech-progress-fill"
                      style={{
                        width: `${checklistPercent}%`,
                        background: checklistPercent === 100 ? 'var(--tech-accent)' : mission.color,
                        boxShadow: checklistPercent === 100 ? '0 0 6px rgba(0,229,160,0.3)' : 'none',
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Bottom row */}
          <div
            className="flex flex-col gap-3 pt-2.5"
            style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex gap-3">
                {mission.truckId && (
                  <div
                    className="flex items-center gap-1 text-[10px] font-bold"
                    style={{ color: 'var(--tech-text-muted)' }}
                  >
                    <TruckIcon className="w-3 h-3" />
                    <span className="truncate max-w-[70px]">{truckName}</span>
                  </div>
                )}
                {colleagueCount > 0 && (
                  <div
                    className="flex items-center gap-1 text-[10px] font-bold"
                    style={{ color: 'var(--tech-text-muted)' }}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>
                      {colleagueCount} collègue{colleagueCount > 1 ? 's' : ''}
                    </span>
                  </div>
                )}
              </div>

              {canQuickAction ? (
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    triggerVibrate('click');
                    const nextStatus = mission.status === 'Planifiée' ? 'En cours' : 'Terminée';
                    onQuickAction!(nextStatus);
                  }}
                  className="rounded-2xl px-3 py-2 text-[11px] font-black uppercase tracking-wide transition-all active:scale-95"
                  style={{
                    background: mission.status === 'Planifiée' ? mission.color : 'var(--tech-accent)',
                    color: '#fff',
                    boxShadow:
                      mission.status === 'Planifiée'
                        ? `0 0 18px ${mission.color}40`
                        : '0 0 18px rgba(0,229,160,0.25)',
                  }}
                >
                  {quickActionLabel}
                </button>
              ) : (
                <div
                  className="flex items-center gap-0.5 text-[11px] font-black transition-all duration-200"
                  style={{ color: isHovered ? mission.color : 'var(--tech-accent)' }}
                >
                  <span>Détails</span>
                  <ChevronRight
                    className="w-3.5 h-3.5 transition-transform duration-200"
                    style={{
                      transform: isHovered ? 'translateX(2px)' : 'translateX(0)',
                    }}
                  />
                </div>
              )}
            </div>

            {/* Indicateur subtil : "← swipe · tap · swipe →" */}
            <div
              className="flex items-center justify-center gap-2 text-[8px] font-black uppercase tracking-widest pt-0.5"
              style={{ color: 'var(--tech-text-muted)', opacity: 0.55 }}
              aria-hidden
            >
              <span>← Détails</span>
              <span style={{ opacity: 0.4 }}>·</span>
              <span>{canQuickAction ? `${quickActionLabel} →` : 'Tap →'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
