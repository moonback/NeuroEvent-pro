import React from 'react';
import { Clock, MapPin, Truck as TruckIcon, Users, ChevronRight } from 'lucide-react';
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
      case 'Planifiée': return 'tech-badge tech-badge-planned py-0.5 px-2 text-[9px]';
      case 'En cours': return 'tech-badge tech-badge-active py-0.5 px-2 text-[9px]';
      case 'Terminée': return 'tech-badge tech-badge-done py-0.5 px-2 text-[9px]';
      default: return 'tech-badge py-0.5 px-2 text-[9px]';
    }
  };

  return (
    <div
      onClick={onClick}
      className="tech-card overflow-hidden cursor-pointer relative"
    >
      {/* Left accent bar */}
      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ background: mission.color }} />

      <div className="p-3 pl-4">
        {/* Header */}
        <div className="flex justify-between items-start mb-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider"
                style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--tech-text-muted)' }}>
                {mission.type}
              </span>
              {isToday && (
                <span className="text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider animate-pulse"
                  style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171' }}>
                  Aujourd'hui
                </span>
              )}
            </div>
            <h3 className="font-extrabold text-sm leading-snug" style={{ color: 'var(--tech-text)' }}>
              {mission.title}
            </h3>
            <p className="text-[11px] font-semibold mt-0.5" style={{ color: 'var(--tech-text-secondary)' }}>
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
        <div className="space-y-1 mb-2">
          <div className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--tech-text-secondary)' }}>
            <Clock className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--tech-text-muted)' }} />
            <span className={isToday ? 'font-bold text-amber-400' : 'font-medium'}>
              {format(mission.start, 'EEEE d MMM HH:mm', { locale: fr })} — {format(mission.end, 'HH:mm')}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--tech-text-secondary)' }}>
            <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--tech-text-muted)' }} />
            <span className="line-clamp-1 font-medium">{mission.address}</span>
          </div>
        </div>

        {/* Progress bar */}
        {progress && (
          <div className="mb-2 p-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--tech-border)' }}>
            <div className="flex justify-between text-[10px] font-bold mb-1">
              <span style={{ color: 'var(--tech-text-muted)' }}>Matériel</span>
              <span style={{ color: progress.percent === 100 ? 'var(--tech-accent)' : 'var(--tech-text-secondary)' }}>
                {progress.pointed}/{progress.total} ({progress.percent}%)
              </span>
            </div>
            <div className="tech-progress-track" style={{ height: '4px' }}>
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
        <div className="flex justify-between items-center pt-2" style={{ borderTop: '1px solid var(--tech-border)' }}>
          <div className="flex gap-3">
            {mission.truckId && (
              <div className="flex items-center gap-1 text-[10px] font-bold" style={{ color: 'var(--tech-text-muted)' }}>
                <TruckIcon className="w-3 h-3" />
                <span className="truncate max-w-[70px]">{truckName}</span>
              </div>
            )}
            {colleagueCount > 0 && (
              <div className="flex items-center gap-1 text-[10px] font-bold" style={{ color: 'var(--tech-text-muted)' }}>
                <Users className="w-3.5 h-3.5" />
                <span>{colleagueCount} collègue{colleagueCount > 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-0.5 text-[11px] font-black" style={{ color: 'var(--tech-accent)' }}>
            <span>Détails</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </div>
  );
}
