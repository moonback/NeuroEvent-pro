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
        transform: isHovered ? 'translateY(-3px)' : 'translateY(0)',
        borderColor: isHovered ? `${mission.color}4a` : 'var(--tech-border)',
        boxShadow: isHovered
          ? `0 16px 40px rgba(0, 0, 0, 0.6), 0 0 20px ${mission.color}1a`
          : '0 4px 20px rgba(0,0,0,0.3)',
      }}
    >
      {/* Left accent gradient bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 z-10 transition-all duration-300"
        style={{
          background: `linear-gradient(180deg, ${mission.color} 0%, ${mission.color}44 100%)`,
          boxShadow: isHovered ? `0 0 12px ${mission.color}60` : `0 0 8px ${mission.color}30`,
        }}
      />

      {/* Top right glow when active or hovered */}
      {(mission.status === 'En cours' || isHovered) && (
        <div
          className="absolute top-0 right-0 w-40 h-24 pointer-events-none transition-opacity duration-300"
          style={{
            background: `radial-gradient(ellipse at top right, ${mission.color}12 0%, transparent 70%)`,
          }}
        />
      )}

      <div className="p-4 pl-4">
        {/* Header with title and badges */}
        <div className="flex justify-between items-start gap-2 mb-2">
          <div className="min-w-0 flex-1">
            {/* Title - bigger and clearer */}
            <h3
              className="font-black text-base leading-tight truncate transition-colors duration-200"
              style={{ color: isHovered ? mission.color : 'var(--tech-text)' }}
            >
              {mission.title}
            </h3>
            {/* Client - secondary text */}
            <p
              className="text-xs font-semibold mt-0.5 truncate"
              style={{ color: 'var(--tech-text-secondary)' }}
            >
              {mission.client}
            </p>
          </div>

          {/* Right side: Status + Signature */}
          <div className="flex flex-col gap-1.5 items-end shrink-0">
            {/* Status badge */}
            <span
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black tracking-wide whitespace-nowrap transition-all duration-200"
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
            {/* Signature badge */}
            {mission.signatureUrl && (
              <span
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-black tracking-wide whitespace-nowrap"
                style={{
                  background: 'rgba(0,229,160,0.12)',
                  border: '1px solid rgba(0,229,160,0.25)',
                  color: 'var(--tech-accent)',
                }}
              >
                ✓ Signé
              </span>
            )}
          </div>
        </div>

        {/* Tags row */}
        <div className="flex items-center gap-1.5 mb-3">
          <span
            className="text-[8px] font-black px-2 py-1 rounded-md uppercase tracking-wider"
            style={{
              background: `${mission.color}0f`,
              color: mission.color,
              border: `1px solid ${mission.color}1a`,
            }}
          >
            {mission.type}
          </span>
          {isToday && (
            <span
              className="text-[8px] font-black px-2 py-1 rounded-md uppercase tracking-wider"
              style={{
                background: 'rgba(255,77,109,0.12)',
                color: '#ff8fa0',
                border: '1px solid rgba(255,77,109,0.2)',
                animation: 'tech-pulse-glow 2s ease-in-out infinite',
              }}
            >
              Aujourd'hui
            </span>
          )}
        </div>

        {/* Info rows */}
        <div className="space-y-1.5 mb-3">
          <div
            className="flex items-center gap-2.5 text-xs"
            style={{ color: 'var(--tech-text-secondary)' }}
          >
            <Clock
              className="w-4 h-4 shrink-0"
              style={{ color: isToday ? '#ffb700' : mission.color }}
            />
            <span className={isToday ? 'font-bold text-amber-400' : 'font-medium'}>
              {format(mission.start, 'EEEE d MMM HH:mm', { locale: fr })} — {format(mission.end, 'HH:mm')}
            </span>
          </div>
          <div
            className="flex items-center gap-2.5 text-xs"
            style={{ color: 'var(--tech-text-secondary)' }}
          >
            <MapPin className="w-4 h-4 shrink-0" style={{ color: mission.color }} />
            <span className="line-clamp-1 font-medium">{mission.address}</span>
          </div>
        </div>

        {/* Progress Grid */}
        {(progress || (isChecklistEnabled && checkedChecklist > 0)) && (
          <div className="grid grid-cols-2 gap-2.5 mb-3">
            {progress && (
              <div
                className="p-2.5 rounded-xl transition-all duration-200"
                style={{
                  background: `${mission.color}08`,
                  border: isHovered ? `1px solid ${mission.color}22` : '1px solid var(--tech-border)',
                }}
              >
                <div className="flex justify-between text-[8px] font-black uppercase tracking-widest mb-1.5">
                  <span style={{ color: 'var(--tech-text-muted)' }}>📦 Matériel</span>
                  <span style={{ color: progress.percent === 100 ? 'var(--tech-accent)' : mission.color, fontWeight: 900 }}>
                    {progress.pointed}/{progress.total}
                  </span>
                </div>
                <div className="tech-progress-track h-1.5 rounded-full overflow-hidden">
                  <div
                    className="tech-progress-fill rounded-full"
                    style={{
                      width: `${progress.percent}%`,
                      background: progress.percent === 100 ? 'var(--tech-accent)' : mission.color,
                      boxShadow: progress.percent === 100 ? '0 0 8px rgba(0,229,160,0.4)' : `0 0 6px ${mission.color}40`,
                    }}
                  />
                </div>
              </div>
            )}

            {isChecklistEnabled && (
              <div
                className={`p-2.5 rounded-xl transition-all duration-200 ${!progress ? 'col-span-2' : ''}`}
                style={{
                  background: `${mission.color}08`,
                  border: isHovered ? `1px solid ${mission.color}22` : '1px solid var(--tech-border)',
                }}
              >
                <div className="flex justify-between text-[8px] font-black uppercase tracking-widest mb-1.5">
                  <span style={{ color: 'var(--tech-text-muted)' }}>✓ Checklist</span>
                  <span style={{ color: checklistPercent === 100 ? 'var(--tech-accent)' : mission.color, fontWeight: 900 }}>
                    {checkedChecklist}/{totalChecklist}
                  </span>
                </div>
                <div className="tech-progress-track h-1.5 rounded-full overflow-hidden">
                  <div
                    className="tech-progress-fill rounded-full"
                    style={{
                      width: `${checklistPercent}%`,
                      background: checklistPercent === 100 ? 'var(--tech-accent)' : mission.color,
                      boxShadow: checklistPercent === 100 ? '0 0 8px rgba(0,229,160,0.4)' : `0 0 6px ${mission.color}40`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Bottom row - Team & Truck */}
        <div
          className="flex flex-wrap items-center justify-between gap-2 pt-3"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex gap-2">
            {mission.truckId && (
              <div
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-bold"
                style={{ 
                  background: `${mission.color}0f`,
                  color: mission.color,
                  border: `1px solid ${mission.color}1a`,
                }}
              >
                <TruckIcon className="w-3 h-3" />
                <span className="truncate max-w-[70px]">{truckName}</span>
              </div>
            )}
            {colleagueCount > 0 && (
              <div
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-bold"
                style={{ 
                  background: `${mission.color}0f`,
                  color: mission.color,
                  border: `1px solid ${mission.color}1a`,
                }}
              >
                <Users className="w-3 h-3" />
                <span>{colleagueCount} pers.</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onQuickAction && mission.status !== 'Terminée' && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  triggerVibrate('click');
                  onQuickAction(mission.status === 'Planifiée' ? 'En cours' : 'Terminée');
                }}
                disabled={mission.status === 'Planifiée' && !isToday}
                className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wide transition-all ${mission.status === 'Planifiée' && !isToday ? 'opacity-50 cursor-not-allowed' : 'active:scale-[0.97]'}`}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: mission.color,
                }}
              >
                {mission.status === 'Planifiée' ? (isToday ? 'Commencer' : 'Jour J requis') : 'Terminer'}
              </button>
            )}

            {/* Right: ChevronRight */}
            <ChevronRight
              className="w-4 h-4 transition-all duration-200"
              style={{
                color: isHovered ? mission.color : 'var(--tech-text-muted)',
                transform: isHovered ? 'translateX(2px)' : 'translateX(0)',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default React.memo(MissionCard);
