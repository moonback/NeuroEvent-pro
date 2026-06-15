import React from 'react';
import { Clock, MapPin, Truck as TruckIcon, Users, ChevronRight, CheckCircle2 } from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { triggerVibrate } from './useTechDashboard';
import { useAuthStore } from '../../store/auth';
import { useStore } from '../../store';

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

function MissionCard({ mission, truckName, colleagueCount, onClick, onQuickAction }: MissionCardProps) {
  const [isHovered, setIsHovered] = React.useState(false);
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

  return (
    <div
      onClick={() => {
        triggerVibrate('click');
        onClick();
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="tech-card overflow-hidden cursor-pointer relative transition-all duration-300 active:scale-[0.99] rounded-2xl"
      style={{
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
        borderColor: isHovered ? `${mission.color}45` : 'var(--tech-border)',
        boxShadow: isHovered
          ? `0 12px 30px rgba(0, 0, 0, 0.55), 0 0 14px ${mission.color}15`
          : '0 4px 20px rgba(0,0,0,0.3)',
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

            {['Planifiée', 'En cours'].includes(mission.status) && onQuickAction ? (
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  triggerVibrate('click');
                  const nextStatus = mission.status === 'Planifiée' ? 'En cours' : 'Terminée';
                  onQuickAction(nextStatus);
                }}
                className="rounded-2xl px-3 py-2 text-[11px] font-black uppercase tracking-wide transition-all active:scale-95"
                style={{
                  background: mission.status === 'Planifiée' ? mission.color : 'var(--tech-accent)',
                  color: '#fff',
                  boxShadow: mission.status === 'Planifiée' ? `0 0 18px ${mission.color}40` : '0 0 18px rgba(0,229,160,0.25)',
                }}
              >
                {mission.status === 'Planifiée' ? 'Démarrer' : 'Terminer'}
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
        </div>
      </div>
    </div>
  );
}

export default React.memo(MissionCard);
