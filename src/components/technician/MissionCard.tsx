import React from 'react';
import { Clock, MapPin, Truck as TruckIcon, Users, ChevronRight, CheckCircle2 } from 'lucide-react';
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
    const pointed = mission.equipments.filter((e) => e.checked).length;
    return { total, pointed, percent: Math.round((pointed / total) * 100) };
  };

  const progress = getEquipmentProgress();

  const getStatusConfig = () => {
    switch (mission.status) {
      case 'Planifiée':
        return {
          badgeClass: 'tech-badge tech-badge-planned',
          dotColor: 'var(--tech-blue)',
          ping: true,
        };
      case 'En cours':
        return {
          badgeClass: 'tech-badge tech-badge-active',
          dotColor: '#ffb700',
          ping: true,
        };
      case 'Terminée':
        return {
          badgeClass: 'tech-badge tech-badge-done',
          dotColor: 'var(--tech-accent)',
          ping: false,
        };
      default:
        return {
          badgeClass: 'tech-badge',
          dotColor: 'var(--tech-text-muted)',
          ping: false,
        };
    }
  };

  const { badgeClass, dotColor, ping } = getStatusConfig();

  return (
    <div
      onClick={() => {
        triggerVibrate('click');
        onClick();
      }}
      className="tech-card overflow-hidden cursor-pointer relative group"
    >
      {/* Left accent gradient bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px] z-10 transition-all duration-300"
        style={{
          background: `linear-gradient(180deg, ${mission.color}ff 0%, ${mission.color}44 100%)`,
          boxShadow: `2px 0 12px ${mission.color}30`,
        }}
      />

      {/* Top right glow when active */}
      {mission.status === 'En cours' && (
        <div
          className="absolute top-0 right-0 w-32 h-16 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at top right, rgba(255,183,0,0.06) 0%, transparent 70%)',
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
              className="font-extrabold text-sm leading-snug tracking-tight"
              style={{ color: 'var(--tech-text)' }}
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
          <span className={badgeClass}>
            <span
              className="relative w-1.5 h-1.5 rounded-full inline-block shrink-0"
              style={{ background: dotColor }}
            >
              {ping && (
                <span
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: dotColor,
                    animation: 'tech-dot-ping 2s cubic-bezier(0,0,0.2,1) infinite',
                  }}
                />
              )}
            </span>
            {mission.status}
          </span>
        </div>

        {/* Info rows */}
        <div className="space-y-1.5 mb-3">
          <div
            className="flex items-center gap-2 text-[11px]"
            style={{ color: 'var(--tech-text-secondary)' }}
          >
            <Clock
              className="w-3.5 h-3.5 shrink-0"
              style={{ color: isToday ? '#ffb700' : 'var(--tech-text-muted)' }}
            />
            <span className={isToday ? 'font-bold' : 'font-medium'} style={{ color: isToday ? '#ffb700' : undefined }}>
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

        {/* Progress bar */}
        {progress && (
          <div
            className="mb-3 p-2.5 rounded-2xl"
            style={{
              background: 'rgba(255,255,255,0.025)',
              border: '1px solid var(--tech-border)',
            }}
          >
            <div className="flex justify-between text-[10px] font-bold mb-1.5">
              <span style={{ color: 'var(--tech-text-muted)' }}>Matériel pointé</span>
              <span
                style={{
                  color: progress.percent === 100 ? 'var(--tech-accent)' : 'var(--tech-text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                {progress.percent === 100 && (
                  <CheckCircle2 className="w-3 h-3" style={{ color: 'var(--tech-accent)' }} />
                )}
                {progress.pointed}/{progress.total}
              </span>
            </div>
            <div className="tech-progress-track">
              <div
                className="tech-progress-fill"
                style={{
                  width: `${progress.percent}%`,
                  background:
                    progress.percent === 100
                      ? 'linear-gradient(90deg, var(--tech-accent), var(--tech-accent-dim))'
                      : `linear-gradient(90deg, ${mission.color}, ${mission.color}bb)`,
                  boxShadow: progress.percent === 100
                    ? '0 0 8px rgba(0,229,160,0.3)'
                    : 'none',
                }}
              />
            </div>
          </div>
        )}

        {/* Bottom row */}
        <div
          className="flex justify-between items-center pt-2.5"
          style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
        >
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

          <div
            className="flex items-center gap-0.5 text-[11px] font-black transition-all duration-200 group-hover:gap-1"
            style={{ color: 'var(--tech-accent)' }}
          >
            <span>Voir</span>
            <ChevronRight
              className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
