import React from 'react';
import { Clock, MapPin, Truck as TruckIcon, Users, ChevronRight, CheckCircle } from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { triggerVibrate } from './useTechDashboard';

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
}

export default function MissionCard({ mission, truckName, colleagueCount, onClick }: MissionCardProps) {
  const isToday = isSameDay(mission.start, new Date());

  const getEquipmentProgress = () => {
    if (!mission.equipments || mission.equipments.length === 0) return null;
    const total = mission.equipments.length;
    const pointed = mission.equipments.filter(e => e.checked).length;
    return { total, pointed, percent: Math.round((pointed / total) * 100) };
  };

  const progress = getEquipmentProgress();

  const getBadgeClass = () => {
    switch (mission.status) {
      case 'Planifiée': return 'tech-badge tech-badge-planned';
      case 'En cours': return 'tech-badge tech-badge-active';
      case 'Terminée': return 'tech-badge tech-badge-done';
      default: return 'tech-badge';
    }
  };

  return (
    <div
      onClick={onClick}
      className="tech-card overflow-hidden cursor-pointer relative"
    >
      {/* Left accent bar */}
      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ background: mission.color }} />

      <div className="p-4 pl-5">
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider"
                style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--tech-text-muted)' }}>
                {mission.type}
              </span>
              {isToday && (
                <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider animate-pulse"
                  style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171' }}>
                  Aujourd'hui
                </span>
              )}
            </div>
            <h3 className="font-extrabold text-base leading-snug" style={{ color: 'var(--tech-text)' }}>
              {mission.title}
            </h3>
            <p className="text-xs font-semibold mt-0.5" style={{ color: 'var(--tech-text-secondary)' }}>
              {mission.client}
            </p>
          </div>
          <span className={getBadgeClass()}>
            <span className="w-1.5 h-1.5 rounded-full inline-block"
              style={{
                background: mission.status === 'Planifiée' ? '#60a5fa' : mission.status === 'En cours' ? '#fbbf24' : '#34d399',
                ...(mission.status !== 'Terminée' ? { animation: 'tech-pulse-glow 2s infinite' } : {})
              }}
            />
            {mission.status}
          </span>
        </div>

        {/* Info rows */}
        <div className="space-y-2 mb-3">
          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--tech-text-secondary)' }}>
            <Clock className="w-4 h-4 shrink-0" style={{ color: 'var(--tech-text-muted)' }} />
            <span className={isToday ? 'font-bold text-amber-400' : 'font-medium'}>
              {format(mission.start, 'EEEE d MMM HH:mm', { locale: fr })} — {format(mission.end, 'HH:mm')}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--tech-text-secondary)' }}>
            <MapPin className="w-4 h-4 shrink-0" style={{ color: 'var(--tech-text-muted)' }} />
            <span className="line-clamp-1 font-medium">{mission.address}</span>
          </div>
        </div>

        {/* Progress bar */}
        {progress && (
          <div className="mb-3 p-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--tech-border)' }}>
            <div className="flex justify-between text-[11px] font-bold mb-1.5">
              <span style={{ color: 'var(--tech-text-muted)' }}>Pointage matériel</span>
              <span style={{ color: progress.percent === 100 ? 'var(--tech-accent)' : 'var(--tech-text-secondary)' }}>
                {progress.pointed}/{progress.total} ({progress.percent}%)
              </span>
            </div>
            <div className="tech-progress-track">
              <div
                className="tech-progress-fill"
                style={{
                  width: `${progress.percent}%`,
                  background: progress.percent === 100
                    ? 'var(--tech-accent)'
                    : `linear-gradient(90deg, ${mission.color}, ${mission.color}cc)`
                }}
              />
            </div>
          </div>
        )}

        {/* Bottom row */}
        <div className="flex justify-between items-center pt-3" style={{ borderTop: '1px solid var(--tech-border)' }}>
          <div className="flex gap-4">
            {mission.truckId && (
              <div className="flex items-center gap-1 text-xs font-bold" style={{ color: 'var(--tech-text-muted)' }}>
                <TruckIcon className="w-3.5 h-3.5" />
                <span className="truncate max-w-[80px]">{truckName}</span>
              </div>
            )}
            {colleagueCount > 0 && (
              <div className="flex items-center gap-1 text-xs font-bold" style={{ color: 'var(--tech-text-muted)' }}>
                <Users className="w-3.5 h-3.5" />
                <span>{colleagueCount} collègue{colleagueCount > 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs font-bold" style={{ color: 'var(--tech-accent)' }}>
            <span>Détails</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
}
